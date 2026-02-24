import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
}

export function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm mt-2 ${
                trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
    </div>
  );
}