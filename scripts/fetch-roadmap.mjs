import { graphql } from '@octokit/graphql';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file if present (for local development)
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (e) {
  // dotenv not available, using environment variables directly
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PROJECT_URL = process.env.PROJECT_URL;

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

if (!PROJECT_URL) {
  console.error('Error: PROJECT_URL environment variable is required');
  process.exit(1);
}

// Parse project URL to extract org and project number
// Format: https://github.com/orgs/{org}/projects/{number}
function parseProjectUrl(url) {
  const match = url.match(/github\.com\/orgs\/([^/]+)\/projects\/(\d+)/);
  if (!match) {
    throw new Error(`Invalid project URL format: ${url}`);
  }
  return { org: match[1], projectNumber: parseInt(match[2], 10) };
}

const { org, projectNumber } = parseProjectUrl(PROJECT_URL);
console.log(`Fetching project #${projectNumber} from org: ${org}`);

// Create authenticated GraphQL client
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

// GraphQL query to fetch project items with milestones and custom fields
const QUERY = `
  query($org: String!, $projectNumber: Int!, $cursor: String) {
    organization(login: $org) {
      projectV2(number: $projectNumber) {
        title
        url
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field {
              id
              name
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
                color
              }
            }
          }
        }
        items(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                  name
                  optionId
                }
                ... on ProjectV2ItemFieldTextValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  text
                }
              }
            }
            content {
              ... on Issue {
                id
                title
                state
                url
                milestone {
                  title
                  dueOn
                }
                labels(first: 10) {
                  nodes {
                    name
                    color
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchAllItems() {
  const items = [];
  let cursor = null;
  let projectInfo = null;
  let projectFields = null;

  do {
    const response = await graphqlWithAuth(QUERY, {
      org,
      projectNumber,
      cursor,
    });

    const project = response.organization.projectV2;
    
    if (!projectInfo) {
      projectInfo = {
        title: project.title,
        url: project.url,
      };
      
      // Extract single-select fields (like Status)
      projectFields = project.fields.nodes
        .filter(field => field.options) // Only single-select fields have options
        .map(field => ({
          id: field.id,
          name: field.name,
          options: field.options.map(opt => ({
            id: opt.id,
            name: opt.name,
            color: opt.color,
          })),
        }));
      
      console.log(`Found ${projectFields.length} custom fields:`, projectFields.map(f => f.name).join(', '));
    }

    const pageItems = project.items.nodes
      .filter(node => node.content) // Include all issues (with or without milestones)
      .map(node => {
        // Extract custom field values
        const customFields = {};
        node.fieldValues.nodes.forEach(fv => {
          if (fv.field && fv.field.name) {
            if (fv.name !== undefined) {
              // Single select field
              customFields[fv.field.name] = {
                value: fv.name,
                optionId: fv.optionId,
              };
            } else if (fv.text !== undefined) {
              // Text field
              customFields[fv.field.name] = {
                value: fv.text,
              };
            }
          }
        });

        return {
          id: node.content.id,
          title: node.content.title,
          state: node.content.state,
          url: node.content.url,
          milestone: node.content.milestone ? {
            title: node.content.milestone.title,
            dueOn: node.content.milestone.dueOn
          } : null, // null for unplanned
          labels: node.content.labels.nodes.map(label => ({
            name: label.name,
            color: label.color,
          })),
          customFields,
        };
      });

    items.push(...pageItems);
    cursor = project.items.pageInfo.hasNextPage ? project.items.pageInfo.endCursor : null;
    
    console.log(`Fetched ${items.length} items so far...`);
  } while (cursor);

  return { projectInfo, projectFields, items };
}

function groupByMilestone(items) {
  const milestoneMap = new Map();
  const TO_BE_PLANNED = 'To be planned';

  for (const item of items) {
    const isUnplanned = !item.milestone;
    const milestoneTitle = isUnplanned ? TO_BE_PLANNED : item.milestone.title;
    const dueOn = isUnplanned ? null : item.milestone.dueOn;

    if (!milestoneMap.has(milestoneTitle)) {
      milestoneMap.set(milestoneTitle, {
        title: milestoneTitle,
        dueOn: dueOn,
        issues: []
      });
    }
    
    milestoneMap.get(milestoneTitle).issues.push({
      id: item.id,
      title: item.title,
      state: item.state,
      url: item.url,
      labels: item.labels,
      customFields: item.customFields,
    });
  }

  // Convert to array, sort alphabetically, but keep "To be planned" at the end
  return Array.from(milestoneMap.values())
    .sort((a, b) => {
      if (a.title === TO_BE_PLANNED) return 1;
      if (b.title === TO_BE_PLANNED) return -1;
      return a.title.localeCompare(b.title);
    });
}

async function main() {
  try {
    console.log('Fetching roadmap data from GitHub...');
    const { projectInfo, projectFields, items } = await fetchAllItems();
    
    console.log(`Total items with milestones: ${items.length}`);

    const milestones = groupByMilestone(items);
    console.log(`Grouped into ${milestones.length} milestones`);

    const outputData = {
      generated_at: new Date().toISOString(),
      project: projectInfo,
      fields: projectFields,
      milestones,
    };

    // Ensure public directory exists
    const publicDir = join(__dirname, '..', 'public');
    mkdirSync(publicDir, { recursive: true });

    // Write output
    const outputPath = join(publicDir, 'roadmap-data.json');
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`Output written to: ${outputPath}`);

  } catch (error) {
    console.error('Error fetching roadmap:', error.message);
    if (error.errors) {
      console.error('GraphQL errors:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
