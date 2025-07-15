import { QuestionEditor } from "./ui/editor";

export default function Component() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      {/* <header className="flex items-center justify-between h-16 px-6 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <Button className="h-8 w-8">
            <XCircle className="h-5 w-5 text-gray-400" />
            <span className="sr-only">Close</span>
          </Button>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Basic info</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Passage</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-800">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
              3
            </div>
            <span>Questions</span>
            <span className="text-xs text-gray-500">(In progress)</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
            <div className="flex items-center justify-center h-6 w-6 rounded-full border border-gray-300 text-gray-500">
              4
            </div>
            <span>Vocabulary</span>
            <span className="text-xs text-gray-500">(Waiting)</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center space-x-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header> */}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Editor (Main Content) */}
        <QuestionEditor />

        {/* Question Group Panel (Right Sidebar) */}
        {/* <QuestionGroupPanel /> */}
      </div>
    </div>
  );
}
