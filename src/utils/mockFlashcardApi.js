/**
 * Generate mock flashcards when the API is not available
 * @param {string} subject - The subject area
 * @param {string} topic - The specific topic
 * @param {number} count - Number of flashcards to generate
 * @returns {Array} - Array of flashcard objects with front and back properties
 */
export const generateMockFlashcards = (subject, topic, count = 5) => {
  // Generic templates for different subjects
  const templates = {
    math: [
      { front: "What is {concept}?", back: "A mathematical concept related to {topic}." },
      { front: "How do you solve for {variable}?", back: "Apply the formula related to {topic}." },
      { front: "Define {term}.", back: "A key term in {topic} that represents a mathematical concept." },
    ],
    science: [
      { front: "Explain the process of {process}.", back: "A process in {topic} where certain elements interact." },
      { front: "What is the function of {component}?", back: "It plays a key role in {topic} by facilitating processes." },
      { front: "Compare {term1} and {term2}.", back: "Two related concepts in {topic} with distinct characteristics." },
    ],
    history: [
      { front: "When did {event} occur?", back: "An important event in {topic} that happened during a specific period." },
      { front: "Who was {person}?", back: "A key figure in {topic} known for their contributions." },
      { front: "What was the significance of {event}?", back: "It impacted {topic} by changing the course of events." },
    ],
    // Default template for any subject
    default: [
      { front: "Define {concept}.", back: "A fundamental concept in {topic}." },
      { front: "What are the key aspects of {concept}?", back: "Important elements of {topic} include several components." },
      { front: "How does {concept} relate to {application}?", back: "In {topic}, this concept applies to various situations." },
    ]
  };

  // Choose the right template set or fall back to default
  const templateSet = templates[subject.toLowerCase()] || templates.default;

  // Generate the requested number of cards
  const mockCards = [];
  for (let i = 0; i < count; i++) {
    // Pick a template randomly
    const template = templateSet[i % templateSet.length];

    // Replace placeholders with more specific terms
    const front = template.front
      .replace('{concept}', `${topic} concept ${i+1}`)
      .replace('{variable}', `variable ${String.fromCharCode(97 + i)}`) // a, b, c, etc.
      .replace('{term}', `${topic} term ${i+1}`)
      .replace('{process}', `${topic} process ${i+1}`)
      .replace('{component}', `${topic} component ${i+1}`)
      .replace('{term1}', `${topic} term ${i*2+1}`)
      .replace('{term2}', `${topic} term ${i*2+2}`)
      .replace('{event}', `${topic} event ${i+1}`)
      .replace('{person}', `${topic} figure ${i+1}`)
      .replace('{application}', `${topic} application ${i+1}`);

    const back = template.back
      .replace('{topic}', topic)
      .replace('{subject}', subject);

    mockCards.push({ front, back });
  }

  return mockCards;
};
