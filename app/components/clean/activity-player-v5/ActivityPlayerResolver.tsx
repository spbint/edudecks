"use client";

import ActivityPlayerV4 from "@/app/components/clean/activity-player-v4/ActivityPlayerV4";
import type { ActivityPlayerV4Props } from "@/app/components/clean/activity-player-v4/ActivityPlayerV4.types";
import ActivityPlayerV5 from "@/app/components/clean/activity-player-v5/ActivityPlayerV5";
import type {
  ActivityPlayerV5Props,
  ActivityV5,
} from "@/app/components/clean/activity-player-v5/types";

type ActivityPlayerResolverProps = {
  v5Activities?: ActivityV5[] | null;
  v5Props?: Omit<ActivityPlayerV5Props, "activities">;
  v4Props: ActivityPlayerV4Props;
};

export function shouldUseActivityPlayerV5(activities?: ActivityV5[] | null) {
  return Boolean(activities?.some((activity) => activity.interactionType && activity.visualModel));
}

export default function ActivityPlayerResolver({
  v5Activities,
  v5Props,
  v4Props,
}: ActivityPlayerResolverProps) {
  if (shouldUseActivityPlayerV5(v5Activities)) {
    return <ActivityPlayerV5 activities={v5Activities ?? []} {...v5Props} />;
  }

  return <ActivityPlayerV4 {...v4Props} />;
}
