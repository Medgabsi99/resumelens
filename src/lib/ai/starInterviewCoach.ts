/**
 * starInterviewCoach.ts
 *
 * Transforms any resume accomplishment bullet point into:
 * 1. Predicted Behavioral Interview Question
 * 2. 4-Part Structured STAR Talking Points (Situation, Task, Action, Result)
 * 3. Gotcha / Interviewer Trap to Avoid
 * 4. Recommended Delivery Time (e.g. 90-120 seconds)
 */

export interface StarOutline {
  bulletText: string;
  predictedQuestion: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  trapToAvoid: string;
  keyActionVerbs: string[];
  recommendedDurationSec: number;
}

export function generateStarCoaching(bullet: string, role = "Software Engineer"): StarOutline {
  const clean = bullet.trim();

  // Extract key verbs and metrics
  const metricMatch = clean.match(/(\d+%|\$\d+|\d+x|\d+ users|\d+ms|\d+ days|\d+ engineers)/i);
  const metric = metricMatch ? metricMatch[0] : "significant quantifiable impact";

  let question = `Tell me about a time you worked on a high-impact initiative related to ${role.toLowerCase()}.`;
  if (/latency|speed|performance|optimiz/i.test(clean)) {
    question =
      "Can you walk me through a challenging performance bottleneck you resolved and how you measured the outcome?";
  } else if (/architect|lead|spearhead|design/i.test(clean)) {
    question =
      "Describe a project where you took technical ownership and led the architecture from concept to delivery.";
  } else if (/microservice|api|backend|database|pipeline/i.test(clean)) {
    question =
      "Tell me about a time you engineered scalable backend infrastructure or automated workflows.";
  } else if (/collaborat|mentor|team|cross-functional/i.test(clean)) {
    question =
      "Tell me about a time you mentored engineers or aligned cross-functional stakeholders on a critical deadline.";
  }

  const situation = `At my previous company, our system faced operational challenges where the existing implementation lacked efficiency and scale.`;
  const task = `I was tasked with diagnosing the core constraints, aligning technical requirements, and delivering a modern solution that satisfied production SLAs.`;
  const action = `I formulated an execution plan: I engineered the core architecture using modern patterns, set up rigorous benchmarking, and collaborated with the engineering team to deploy iteratively with zero downtime.`;
  const result = `The deployment was a major success: We achieved ${metric}, improved team release velocity, and established a repeatable technical standard across the engineering org.`;

  const trapToAvoid = `Avoid speaking only in 'we' without clarifying your specific personal technical contributions and trade-offs made during implementation.`;

  return {
    bulletText: clean,
    predictedQuestion: question,
    situation,
    task,
    action,
    result,
    trapToAvoid,
    keyActionVerbs: ["Architected", "Spearheaded", "Optimized", "Benchmarked", "Delivered"],
    recommendedDurationSec: 90,
  };
}
