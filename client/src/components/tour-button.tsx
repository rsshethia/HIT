import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

// Reusable self-paced tour launcher. Lives top-right in each tool's header.
// Tour content lives in client/src/data/tours.ts (one export per tool) so
// adding a tour to a new tool = write steps + drop this button in.
export function TourButton({ steps, label = "Tour" }: { steps: DriveStep[]; label?: string }) {
  const start = () => {
    const tour = driver({
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      doneBtnText: "Finish",
      steps,
    });
    tour.drive();
  };

  return (
    <Button variant="outline" size="sm" onClick={start} title="Take a self-paced guided tour">
      <GraduationCap className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
