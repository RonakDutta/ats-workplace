import React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import Menu, { MenuItem } from "./Menu";
import Segmented from "./Segmented";
import Tooltip from "./Tooltip";
import { useTheme } from "../../lib/theme";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun, title: "Always use the light theme" },
  { value: "system", label: "System", icon: Monitor, title: "Follow your device setting" },
  { value: "dark", label: "Dark", icon: Moon, title: "Always use the dark theme" },
];

/** Labelled segmented control. Used where there is room to spell it out. */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  return <Segmented label="Theme" value={theme} onChange={setTheme} options={OPTIONS} />;
}

/** Compact icon trigger opening the same three choices. For toolbars. */
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
            className="size-8.5 rounded-lg flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
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
          trailing={theme === value ? <Check className="size-3.5 shrink-0" /> : null}
        >
          {label}
        </MenuItem>
      ))}
    </Menu>
  );
}
