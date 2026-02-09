import { Link, useLocation } from "react-router-dom";
import { Activity, BarChart3, Info } from "lucide-react";

const navItems = [
  { path: "/", label: "Prediction", icon: Activity },
  { path: "/analysis", label: "Data Analysis", icon: BarChart3 },
  { path: "/about", label: "About", icon: Info },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <Activity className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Predictive Pulse</h1>
              <p className="text-xs opacity-80 hidden sm:block">
                AI-Powered Cardiovascular Risk Assessment
              </p>
            </div>
          </div>
          <nav className="flex gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === path
                    ? "bg-primary-foreground/20 shadow-inner"
                    : "opacity-80 hover:opacity-100 hover:bg-primary-foreground/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
