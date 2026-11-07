import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

// Reusable self-paced tour launcher. Lives top-right in each tool's header.
// Tour content lives in client/src/data/tours.ts (one export per tool) so
// adding a tour to a new tool = write steps + drop this button in.
// Pass the same size as the neighbouring header buttons so the row aligns.
export function TourButton({
  steps,
  label = "Tour",
  size = "sm",
}: {
  steps: DriveStep[];
  label?: string;
  size?: "sm" | "default" | "lg";
}) {
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
    <Button variant="outline" size={size} onClick={start} title="Take a self-paced guided tour">
      <GraduationCap className={size === "lg" ? "w-5 h-5 mr-2" : "h-4 w-4 mr-2"} />
      {label}
    </Button>
  );
}
