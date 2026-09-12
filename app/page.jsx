import Hero from "../components/Hero";
import FeaturedBooks from "../components/FeaturedBooks";
import PublishingProcess from "../components/PublishingProcess";
import AuthorBenefits from "../components/AuthorBenefits";

export const metadata = {
  title: "Independent Book Publishing for Authors",
  description:
    "Professional editing, design, production, and distribution services that help independent writers publish exceptional books.",
  alternates: {
    canonical: "https://bookpublishing.geo-drops.com",
  },
};

export default function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <FeaturedBooks />
      <PublishingProcess />
      <AuthorBenefits />
    </main>
  );
}