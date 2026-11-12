import { fireEvent, render, screen } from "@testing-library/react";
import { EventImage, EVENT_FALLBACK_IMAGE } from "@/components/EventImage";

describe("EventImage", () => {
  it("loads images from unknown hosts directly instead of crashing next/image", () => {
    render(<EventImage src="https://photos.example.dz/championnat.jpg" alt="Championnat" />);
    expect(screen.getByAltText("Championnat")).toHaveAttribute("src", "https://photos.example.dz/championnat.jpg");
  });

  it("keeps the optimizer for allowed hosts", () => {
    render(<EventImage src="https://images.unsplash.com/photo-1" alt="Unsplash" />);
    expect(screen.getByAltText("Unsplash").getAttribute("src")).toContain("/_next/image?url=");
  });

  it("uses the club placeholder when there is no image", () => {
    render(<EventImage src={null} alt="Sans image" />);
    expect(screen.getByAltText("Sans image")).toHaveAttribute("src", EVENT_FALLBACK_IMAGE);
  });

  it("falls back to the placeholder when the image fails to load", () => {
    render(<EventImage src="https://broken.example.dz/missing.jpg" alt="Cassée" />);
    fireEvent.error(screen.getByAltText("Cassée"));
    const img = screen.getByAltText("Cassée");
    expect(img).toHaveAttribute("src", EVENT_FALLBACK_IMAGE);
    expect(img).toHaveAttribute("data-fallback", "true");
  });
});
