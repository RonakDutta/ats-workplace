import React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import Menu, { MenuItem } from "./Menu";
import Tooltip from "./Tooltip";
import { useTheme } from "../../lib/theme";
import { cn } from "../../lib/cn";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun, hint: "Always use the light theme" },
  { value: "system", label: "System", icon: Monitor, hint: "Follow your device setting" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Always use the dark theme" },
];

/** Labelled segmented control. Used where there is room to spell it out. */
export function ThemeSegmented({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center p-0.5 bg-sunken border border-line-soft rounded-sm",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon, hint }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            title={hint}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xs text-[12.5px] font-medium",
              "transition-colors duration-150 ease-out-soft",
              active
                ? "bg-surface text-ink shadow-xs"
                : "text-faint hover:text-muted",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact icon trigger opening the same three named choices. For toolbars. */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const current = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[1];
  const CurrentIcon = current.icon;

  return (
    <Menu
      width={200}
      trigger={(props) => (
        <Tooltip label={`Theme: ${current.label}`}>
          <button
            {...props}
            aria-label={`Theme, currently ${current.label}`}
            className="size-8 rounded-sm flex items-center justify-center text-muted hover:text-ink hover:bg-sunken transition-colors"
          >
            <CurrentIcon className="size-4" />
          </button>
        </Tooltip>
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <MenuItem
          key={value}
          icon={Icon}
          selected={theme === value}
          onClick={() => setTheme(value)}
          trailing={
            theme === value ? <Check className="size-3.5 shrink-0" /> : null
          }
        >
          {label}
        </MenuItem>
      ))}
    </Menu>
  );
}
