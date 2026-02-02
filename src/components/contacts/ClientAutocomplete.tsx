import { useState, useRef, useEffect } from "react";
import { useClients, Client } from "@/hooks/useClients";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ClientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: Client) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function ClientAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing client name...",
  className,
  error,
}: ClientAutocompleteProps) {
  const { data: clients = [] } = useClients();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter clients based on input
  const filteredClients = value.length >= 2
    ? clients.filter((client) =>
        client.name.toLowerCase().includes(value.toLowerCase()) ||
        client.company_name?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredClients.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredClients.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
          handleSelect(filteredClients[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (client: Client) => {
    onChange(client.name);
    onSelect(client);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= 2);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(error && "border-destructive", className)}
      />
      
      {isOpen && filteredClients.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredClients.map((client, index) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleSelect(client)}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                highlightedIndex === index && "bg-accent"
              )}
            >
              <div className="font-medium text-sm">{client.name}</div>
              {client.company_name && (
                <div className="text-xs text-muted-foreground">
                  {client.company_name}
                </div>
              )}
              {(client.phone || client.email) && (
                <div className="text-xs text-muted-foreground">
                  {[client.phone, client.email].filter(Boolean).join(" • ")}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
