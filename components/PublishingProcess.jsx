export default function PublishingProcess() {
  const stages = [
    {
      number: "01",
      title: "Editorial review",
      description:
        "Share your manuscript and publishing goals with our team. We assess its voice, audience, and readiness, then provide a clear editorial recommendation.",
    },
    {
      number: "02",
      title: "Collaborative production",
      description:
        "Work alongside experienced editors and designers to refine your words, shape your cover, and create professional print and digital editions.",
    },
    {
      number: "03",
      title: "Worldwide release",
      description:
        "Launch your finished book through a coordinated release, with distribution support designed to reach readers across major global markets.",
    },
    {
      number: "04",
      title: "Author growth",
      description:
        "Keep building beyond publication with practical guidance, promotional resources, and a long-term strategy for your independent author career.",
    },
  ];

  return (
    <section
      id="process"
      className="section process-section"
      aria-labelledby="publishing-process-title"
    >
      <div className="container">
        <header className="section-heading">
          <span className="eyebrow">Your path to publication</span>
          <h2 id="publishing-process-title">
            A thoughtful process, from manuscript to readers
          </h2>
          <p>
            Every book deserves attentive craft and a clear route forward. Our
            publishing process keeps you informed, involved, and in control at
            every stage.
          </p>
        </header>

        <ol className="process-grid" aria-label="Publishing process stages">
          {stages.map((stage) => (
            <li className="process-step" key={stage.number}>
              <article>
                <span className="process-number" aria-hidden="true">
                  {stage.number}
                </span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}