import { useEffect } from "react";
import { useLocation } from "react-router";
import { useAuth, addAuditLog } from "../context/AuthContext";

export function ClickTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement;
        
        // Expanded selector to catch inputs, checkboxes, dropdowns, and form labels!
        const clickable = target.closest("button, a, [role='button'], input, select, textarea, label, summary, details");

        if (clickable) {
          const element = clickable as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          
          // Attempt to resolve a meaningful name for the element
          let label = 
            element.getAttribute("aria-label") || 
            element.getAttribute("title") || 
            element.innerText || 
            element.getAttribute("placeholder") || // Captures input placeholders
            element.getAttribute("value") ||
            element.getAttribute("name") ||
            element.id;

          // If label is still empty and it's an input with an ID, try to find its matching <label>
          if ((!label || label.trim() === "") && element.id && tagName === 'input') {
             const labelEl = document.querySelector(`label[for='${element.id}']`);
             if (labelEl) label = (labelEl as HTMLElement).innerText;
          }

          // If label is still empty (e.g. icon-only button without aria-label), try to find an SVG or icon class
          if (!label || label.trim() === "") {
            const icon = element.querySelector("svg, i, span[class*='icon']");
            if (icon) {
               label = "Icon Button";
               const classString = icon.getAttribute("class") || "";
               const lucideMatch = classString.match(/lucide-([a-z0-9-]+)/);
               if (lucideMatch) {
                  label = `${lucideMatch[1]} icon`;
               }
            } else {
               label = `<${tagName}>`;
            }
          }

          // Clean up label and format it
          label = label.replace(/\s+/g, ' ').trim().substring(0, 60);
          
          // Format actions nicely based on the tag type
          let actionContext = `Clicked "${label}"`;
          if (tagName === 'input' && element.getAttribute("type") === 'checkbox') {
             actionContext = `Toggled checkbox "${label}"`;
          } else if (tagName === 'select') {
             actionContext = `Opened dropdown "${label}"`;
          } else if (tagName === 'input' && element.getAttribute("type") !== 'submit' && element.getAttribute("type") !== 'button') {
             actionContext = `Focused input "${label}"`;
          }

          // Get context
          const path = location.pathname;
          const userEmail = user ? user.email : "Guest";

          addAuditLog({
            category: "Click",
            action: "UI Interaction",
            status: "Success",
            user: userEmail,
            details: `${actionContext} on ${path}`,
          });
        }
      } catch (error) {
        console.error("ClickTracker error:", error);
      }
    };

    // Use capture phase to ensure we catch events before they might be stopped
    window.addEventListener("click", handleClick, true);
    
    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, [location.pathname, user]);

  return null;
}