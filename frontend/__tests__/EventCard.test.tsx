import { render, screen } from "@testing-library/react";
import { EventCard } from "@/components/EventCard";
import type { Event } from "@/types/domain";

jest.mock("next/image", () => function Image(props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean; priority?: boolean }) {
  const { fill, unoptimized, priority, ...imgProps } = props;
  void fill; void unoptimized; void priority;
  return <img {...imgProps} alt={props.alt ?? ""} />;
});

const event: Event = {
  id: 1,
  title: "Championnat National Seniors 2025",
  description: "Demo",
  imageUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865",
  location: "Constantine, Algérie",
  startDatetime: "2025-05-25T09:00:00+01:00",
  endDatetime: "2025-05-28T17:00:00+01:00",
  organizerName: "Judo Club Constantine",
  status: "LIVE"
};

describe("EventCard", () => {
  it("renders event identity and live status", () => {
    render(<EventCard event={event} />);
    expect(screen.getByText("Championnat National Seniors 2025")).toBeInTheDocument();
    expect(screen.getByText("Constantine, Algérie")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });
});
