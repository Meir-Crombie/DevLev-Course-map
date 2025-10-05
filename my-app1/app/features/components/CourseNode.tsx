'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Course } from '../schema/catalog-schema';

interface CourseNodeData {
  course: Course;
  onDialogOpen: (courseId: string) => void;
  handles?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
}

export function CourseNode({ data }: NodeProps) {
  const { course, onDialogOpen, handles = { top: true, bottom: true } } = data as unknown as CourseNodeData;

  return (
    <Card className={`p-4 w-60 min-h-[84px] border-2 ${
      course.mandatory ? 'border-blue-600' : 'border-green-600'
    }`}>
      {/* Handles */}
      {handles.top && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-500"
        />
      )}
      {handles.bottom && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500"
        />
      )}
      {handles.left && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-500"
        />
      )}
      {handles.right && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-500"
        />
      )}

      {/* Content */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h3 className={`font-bold text-sm leading-tight ${
            course.mandatory ? 'text-blue-700' : 'text-green-700'
          }`}>
            {course.name}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-2"
            onClick={() => onDialogOpen(course.id)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {course.credits && (
            <Badge variant="secondary" className="text-xs">
              {course.credits} credits
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {course.semester}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {course.year}
          </Badge>
        </div>
      </div>
    </Card>
  );
}