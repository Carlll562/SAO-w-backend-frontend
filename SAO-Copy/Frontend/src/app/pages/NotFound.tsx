import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <div className="mt-4">
            <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
            <p className="text-gray-600 mt-2">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => window.history.back()}>
            <button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </Button>
        </div>
      </div>
    </div>
  );
}
