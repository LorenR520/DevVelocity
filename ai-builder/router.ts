// ai-builder/router.ts

import { getAllowedCapabilities, generateQuestions, recommendPlan, hasFeature } from "./plan-logic";
import { saveAnswer, saveFinalBuild } from "./actions";
import { generateTemplate } from "./template-engine";

/**
 * The AI Builder Flow Router
 * Controls all steps of the builder experience
 */

export class AIBuildRouter {
  user: any;
  planId: string;
  capabilities: any;
  questions: any[];

  constructor(user: any) {
    this.user = user;
    this.planId = user?.plan_id || "developer";

    // Load plan-aware limits & features
    this.capabilities = getAllowedCapabilities(this.planId);

    // Generate question list dynamically
    this.questions = generateQuestions(this.planId);
  }

  /**
   * Returns the generated question list for UI wizards
   */
  getQuestions() {
    return this.questions;
  }

  /**
   * Handles submitting one question answer
   */
  async submitAnswer(stepIndex: number, answer: any) {
    await saveAnswer(this.user.id, stepIndex, answer);

    const isLast = stepIndex === this.questions.length - 1;
    return { nextStep: isLast ? "generate" : stepIndex + 1, finished: isLast };
  }

  /**
   * Once all questions are answered, we build the template.
   */
  async finalizeBuild() {
    const answers = await this.loadAnswers();

    // -----------------------------
    // ⭐ Check for required upgrades
    // -----------------------------
    const upgradeNeeded = this.checkUpgrade(answers);

    if (upgradeNeeded) {
      return { upgrade: upgradeNeeded };
    }

    // -----------------------------
    // ⭐ Generate Cloud Templates
    // -----------------------------
    const output = await generateTemplate({
      user: this.user,
      answers,
      capabilities: this.capabilities
    });

    // Save result
    await saveFinalBuild(this.user.id, output);

    return { success: true, output };
  }

  /**
   * Load user's previous answers
   */
  async loadAnswers() {
    const res = await fetch(`${process.env.APP_URL}/api/ai-builder/answers?user=${this.user.id}`);
    const data = await res.json();
    return data.answers || {};
  }

  /**
   * Determines if the user requested features outside their tier
   */
  checkUpgrade(answers: any) {
    const plan = this.planId;
    const requested = {
      multiCloud: answers.clouds?.length > 1,
      failover: answers.failover === "automatic" || answers.failover === "ai",
      advancedBuilder: answers.builderMode === "enterprise",
      security: answers.security,
      sso: answers.ssoProvider,
    };

    // Multi-cloud
    if (requested.multiCloud && !hasFeature(plan, "multi_cloud")) {
      return {
        reason: "Multi-cloud deployments require Startup or higher.",
        required: "startup"
      };
    }

    // Failover
    if (requested.failover && !hasFeature(plan, "failover")) {
      return {
        reason: "Automated failover requires Team or Enterprise.",
        required: "team"
      };
    }

    // SSO
    if (requested.sso && !hasFeature(plan, "sso_basic")) {
      return {
        reason: "SSO requires Startup or higher.",
        required: "startup"
      };
    }

    // Continuous scheduled tasks
    if (answers.schedules === "continuous" && !hasFeature(plan, "scheduled_tasks_continuous")) {
      return {
        reason: "Continuous schedulers require Enterprise.",
        required: "enterprise"
      };
    }

    return null; // safe to generate
  }

  /**
   * Suggest optimal plan after all answers
   */
  recommendUpgrade(answers: any) {
    return recommendPlan(answers);
  }
}
