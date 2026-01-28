import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Truck, MapPin, Calendar, Shovel } from "lucide-react";

interface AddToScheduleMenuProps {
  onScheduleSubbie: () => void;
  onAddPour: () => void;
  onAddSiteVisit: () => void;
}

export function AddToScheduleMenu({
  onScheduleSubbie,
  onAddPour,
  onAddSiteVisit,
}: AddToScheduleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add to Schedule
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onScheduleSubbie}>
          <Truck className="w-4 h-4 mr-2" />
          Schedule a Subbie
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MapPin className="w-4 h-4 mr-2" />
            Add a Site Visit
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onClick={onAddPour}>
              <Shovel className="w-4 h-4 mr-2" />
              Add a Pour
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddSiteVisit}>
              <Calendar className="w-4 h-4 mr-2" />
              Quote Site Visit
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
