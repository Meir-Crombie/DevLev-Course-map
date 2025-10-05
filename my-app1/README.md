# Academic Course Catalog Application

A modern, interactive course catalog application that visualizes academic courses and their prerequisite relationships using a dual-view interface.

## Features

### Core Functionality
- **JSON Data Import**: Upload course catalog data with automatic validation and cycle detection
- **Interactive Course Map**: Visual graph representation of course prerequisites using React Flow
- **Course List View**: Traditional grid-based course browsing
- **Course Details Dialog**: Comprehensive course information with navigation
- **Search & Filtering**: Real-time course search across names, IDs, and descriptions
- **Cycle Detection**: Automatic detection and rejection of circular prerequisite dependencies

### Graph Features
- Topological layout using Kahn's algorithm
- Expandable/collapsible course nodes
- Interactive navigation with zoom and pan
- Course selection and centering
- Visual distinction between required and elective courses

## Technology Stack

- **Framework**: Next.js 15.5.4 with App Router
- **UI Library**: React 19.1.0 with TypeScript
- **Graph Visualization**: @xyflow/react (React Flow v12.8.6)
- **Schema Validation**: Zod v4.1.11
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DevLev-Course-map/my-app1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Importing Course Data

1. Prepare a JSON file with your course catalog data (see `sample-catalog.json` for format)
2. Click the "Import JSON" button in the header
3. Select your JSON file
4. The application will validate the data and display the course graph

### Course Data Format

```json
{
  "courses": [
    {
      "id": "cs101",
      "name": "Introduction to Computer Science",
      "credits": 3,
      "semester": "Fall",
      "year": "1st Year",
      "mandatory": true,
      "prerequisites": ["math101"],
      "description": "Course description...",
      "corequisites": ["math101"],
      "requiredKnowledge": ["Basic programming"],
      "notes": "Additional notes"
    }
  ],
  "requirements": [...],
  "metadata": {
    "lastUpdated": "2024-01-15",
    "department": "Computer Science",
    "totalCourses": 10,
    "notes": ["Important information"]
  }
}
```

### Navigation

- **Course Map Tab**: Interactive graph view with expandable nodes
- **Course List Tab**: Grid view of all courses with search functionality
- **Course Details**: Click any course to view detailed information
- **Prerequisites/Dependencies**: Navigate between related courses

## Project Structure

```
my-app1/
├── app/
│   ├── features/
│   │   ├── actions/
│   │   │   └── graph-utils.ts      # Graph algorithms and utilities
│   │   ├── components/
│   │   │   ├── CourseNode.tsx      # React Flow custom node component
│   │   │   └── CourseDetailsDialog.tsx # Course details modal
│   │   └── schema/
│   │       └── catalog-schema.ts   # Zod validation schemas
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main application component
├── components/ui/                  # shadcn/ui components
├── lib/
│   └── utils.ts                    # Utility functions
└── public/                         # Static assets
```

## Key Components

### Graph Algorithms
- **Kahn's Algorithm**: Topological sorting for course layout
- **Cycle Detection**: Prevents circular dependencies
- **Layout Calculation**: Automatic positioning of nodes

### State Management
- React hooks for local state management
- Efficient handling of expanded/collapsed course states
- Search query and filtering logic

### UI Components
- Responsive design with Tailwind CSS
- Accessible components using Radix UI
- Interactive graph with React Flow
- Modal dialogs for course details

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Update Zod schemas in `catalog-schema.ts` for new data fields
2. Implement graph algorithms in `graph-utils.ts`
3. Create new components in the `components/` directory
4. Update the main `page.tsx` component to integrate new features

## Sample Data

A sample course catalog (`sample-catalog.json`) is included with:
- 10 computer science courses
- Prerequisite relationships
- Required and elective courses
- Metadata and requirements

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
