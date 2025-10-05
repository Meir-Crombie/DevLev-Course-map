import { Node, Edge } from '@xyflow/react';
import { Catalog } from '../schema/catalog-schema';

// Graph building and layout utilities

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export function buildGraph(catalog: Catalog): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create nodes
  catalog.courses.forEach((course) => {
    const node: Node = {
      id: course.id,
      type: 'courseNode',
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      data: {
        course,
        onDialogOpen: (courseId: string) => {
          // This will be set by the parent component
        },
      },
    };
    nodes.push(node);
  });

  // Create edges from prerequisites
  catalog.courses.forEach((course) => {
    if (course.prerequisites) {
      course.prerequisites.forEach((prereqId) => {
        const edge: Edge = {
          id: `${prereqId}-${course.id}`,
          source: prereqId,
          target: course.id,
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
        };
        edges.push(edge);
      });
    }
  });

  return { nodes, edges };
}

export function layoutElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  // Kahn's algorithm for topological sorting with proper level assignment
  const adjacencyList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const nodeLevels: Record<string, number> = {};

  // Initialize
  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
    nodeLevels[node.id] = 0; // Default level
  });

  // Build adjacency list and in-degree
  edges.forEach((edge) => {
    adjacencyList[edge.source].push(edge.target);
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  });

  // Find nodes with no incoming edges (roots)
  const queue: string[] = [];
  Object.keys(inDegree).forEach((nodeId) => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
      nodeLevels[nodeId] = 0; // Root nodes are at level 0
    }
  });

  const visited = new Set<string>();
  let currentLevel = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;
    currentLevel++;

    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift()!;
      visited.add(nodeId);

      // Process neighbors
      adjacencyList[nodeId].forEach((neighborId) => {
        // Update the level of the neighbor (max of current level)
        nodeLevels[neighborId] = Math.max(nodeLevels[neighborId], currentLevel);

        inDegree[neighborId]--;
        if (inDegree[neighborId] === 0) {
          queue.push(neighborId);
        }
      });
    }
  }

  // Check for cycles
  if (visited.size !== nodes.length) {
    throw new Error('Cycle detected in prerequisite graph');
  }

  // Count nodes per level for positioning
  const levelCounts: Record<number, number> = {};
  Object.values(nodeLevels).forEach(level => {
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  // Calculate positions
  const nodeWidth = 240;
  const nodeHeight = 84;
  const horizontalGap = 40;
  const verticalGap = 80;

  // Track position within each level
  const levelPositions: Record<number, number> = {};

  const positionedNodes = nodes.map((node) => {
    const level = nodeLevels[node.id] || 0;
    const positionInLevel = levelPositions[level] || 0;
    levelPositions[level] = positionInLevel + 1;

    let x: number, y: number;

    if (direction === 'TB') {
      x = positionInLevel * (nodeWidth + horizontalGap);
      y = level * (nodeHeight + verticalGap);
    } else {
      x = level * (nodeWidth + horizontalGap);
      y = positionInLevel * (nodeHeight + verticalGap);
    }

    return {
      ...node,
      position: { x, y },
      data: {
        ...node.data,
        handles: direction === 'TB'
          ? { top: true, bottom: true }
          : { left: true, right: true },
      },
    };
  });

  return positionedNodes;
}

export function hasCycle(edges: Edge[]): boolean {
  // Use Kahn's algorithm to detect cycles
  const adjacencyList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const allNodes = new Set<string>();

  // Collect all nodes
  edges.forEach((edge) => {
    allNodes.add(edge.source);
    allNodes.add(edge.target);
  });

  // Initialize
  allNodes.forEach((nodeId) => {
    adjacencyList[nodeId] = [];
    inDegree[nodeId] = 0;
  });

  // Build adjacency list and in-degree
  edges.forEach((edge) => {
    adjacencyList[edge.source].push(edge.target);
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  });

  // Find nodes with no incoming edges
  const queue: string[] = [];
  Object.keys(inDegree).forEach((nodeId) => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  });

  let visitedCount = 0;

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    visitedCount++;

    adjacencyList[nodeId].forEach((neighborId) => {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        queue.push(neighborId);
      }
    });
  }

  // If we didn't visit all nodes, there's a cycle
  return visitedCount !== allNodes.size;
}

export function getDependentCourses(edges: Edge[], courseId: string): string[] {
  return edges
    .filter((edge) => edge.source === courseId)
    .map((edge) => edge.target);
}

export function getPrerequisiteCourses(courseId: string, edges: Edge[]): string[] {
  return edges
    .filter((edge) => edge.target === courseId)
    .map((edge) => edge.source);
}