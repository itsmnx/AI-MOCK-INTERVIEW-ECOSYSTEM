// backend/src/services/ai/proctoringService.js
class ProctoringService {
  constructor() {
    this.maxFlags = 5;
    this.violationWeights = {
      tab_switch: 1,
      window_blur: 1,
      copy_paste: 2,
      long_inactivity: 1,
      multiple_faces: 2,
      face_not_visible: 1,
      background_voices: 1,
      phone_usage: 2,
      looking_away: 1
    };
  }

  analyzeViolation(violationType, metadata = {}) {
    const weight = this.violationWeights[violationType] || 1;
    
    return {
      type: violationType,
      weight,
      timestamp: new Date(),
      severity: weight >= 2 ? 'high' : 'normal',
      metadata,
      flagValue: weight
    };
  }

  shouldTerminateInterview(currentFlags) {
    return currentFlags >= this.maxFlags;
  }

  generateViolationReport(violations) {
    const summary = {
      totalViolations: violations.length,
      totalFlags: violations.reduce((sum, v) => sum + v.weight, 0),
      byType: {},
      timeline: [],
      recommendation: ''
    };
    
    violations.forEach(violation => {
      summary.byType[violation.type] = (summary.byType[violation.type] || 0) + 1;
      summary.timeline.push({
        time: violation.timestamp,
        type: violation.type,
        severity: violation.severity
      });
    });
    
    if (summary.totalFlags >= this.maxFlags) {
      summary.recommendation = 'Interview terminated due to excessive violations';
    } else if (summary.totalFlags >= this.maxFlags * 0.7) {
      summary.recommendation = 'Warning: Multiple violations detected';
    } else if (summary.totalFlags > 0) {
      summary.recommendation = 'Minor violations detected - please maintain focus';
    }
    
    return summary;
  }
}

export default ProctoringService;