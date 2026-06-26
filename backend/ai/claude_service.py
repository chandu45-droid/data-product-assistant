"""Claude API integration for AI-powered extraction, generation, and analysis."""

import json
import re

from config import settings


def _parse_json_from_response(text: str) -> dict | list:
    """Extract JSON from Claude's response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    code_block = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
    if code_block:
        return json.loads(code_block.group(1).strip())

    # Try parsing the entire response as JSON
    text = text.strip()
    # Find the first { or [ and last } or ]
    start_obj = text.find("{")
    start_arr = text.find("[")
    if start_obj == -1 and start_arr == -1:
        raise ValueError(f"No JSON found in response: {text[:200]}")

    if start_arr == -1 or (start_obj != -1 and start_obj < start_arr):
        # Object
        end = text.rfind("}") + 1
        return json.loads(text[start_obj:end])
    else:
        # Array
        end = text.rfind("]") + 1
        return json.loads(text[start_arr:end])


def _get_client():
    """Get Anthropic client. Returns None if no API key configured."""
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    except Exception:
        return None


def _call_claude(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
    """Make a Claude API call. Returns the text response."""
    client = _get_client()
    if client is None:
        return ""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        temperature=temperature,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text


# ---------------------------------------------------------------------------
# Mock data for demo mode (no API key)
# ---------------------------------------------------------------------------

def _mock_discovery() -> dict:
    """Return realistic mock discovery data for a Customer Analytics Platform."""
    return {
        "business_objectives": [
            {
                "name": "Unified Customer View",
                "description": "Create a 360-degree view of customer interactions across all touchpoints to enable personalized experiences and reduce churn."
            },
            {
                "name": "Revenue Growth through Cross-sell",
                "description": "Increase average revenue per customer by 15% through data-driven cross-selling and upselling recommendations."
            },
            {
                "name": "Operational Efficiency",
                "description": "Reduce customer service resolution time by 30% through predictive issue detection and proactive outreach."
            }
        ],
        "stakeholders": [
            {"name": "VP of Marketing", "role": "Executive Sponsor", "interest": "Campaign ROI and customer segmentation accuracy"},
            {"name": "Head of Data Engineering", "role": "Technical Lead", "interest": "Data pipeline reliability and scalability"},
            {"name": "Customer Success Director", "role": "Business Owner", "interest": "Churn prediction and customer health scores"},
            {"name": "Chief Revenue Officer", "role": "Key Stakeholder", "interest": "Revenue attribution and forecast accuracy"},
            {"name": "Data Privacy Officer", "role": "Compliance", "interest": "GDPR/CCPA compliance and data governance"}
        ],
        "kpis": [
            {
                "name": "Customer Lifetime Value (CLV)",
                "description": "Predicted total revenue a customer will generate over their entire relationship",
                "target": "Increase average CLV by 20% within 12 months",
                "measurement": "Monthly cohort analysis comparing CLV before and after platform launch"
            },
            {
                "name": "Churn Rate",
                "description": "Percentage of customers who stop using the product in a given period",
                "target": "Reduce monthly churn from 5.2% to 3.5%",
                "measurement": "Weekly churn tracking with 30/60/90-day prediction accuracy"
            },
            {
                "name": "Cross-sell Conversion Rate",
                "description": "Percentage of cross-sell recommendations that result in a purchase",
                "target": "Achieve 12% conversion rate on AI-driven recommendations",
                "measurement": "A/B testing against control group with weekly reporting"
            },
            {
                "name": "Data Freshness",
                "description": "Time lag between customer interaction and data availability in the platform",
                "target": "< 15 minutes for critical events, < 4 hours for batch data",
                "measurement": "Automated monitoring dashboard with SLA alerts"
            }
        ],
        "assumptions": [
            "Customer data from all source systems can be matched using email or phone number as a primary key",
            "Historical transaction data for the past 3 years is available and clean enough for ML model training",
            "The existing data warehouse can handle a 40% increase in query volume",
            "Marketing team has capacity to act on segmentation insights within 2-week sprint cycles",
            "Privacy consent records exist for at least 80% of the customer base"
        ],
        "risks": [
            "Data quality issues in legacy CRM system may require significant cleansing effort (6-8 weeks)",
            "GDPR compliance requirements may limit the scope of customer data unification in EU markets",
            "Key data engineer attrition risk — only 2 team members understand the legacy ETL pipelines",
            "Real-time streaming infrastructure (Kafka) has not been tested at the required throughput",
            "ML model bias risk — historical data may not represent current customer demographics"
        ],
        "success_metrics": [
            "Platform processing 10M+ customer records with < 2s query response time",
            "95% stakeholder satisfaction score in quarterly survey",
            "Data governance framework documented and approved by compliance",
            "Self-service analytics adoption by 5+ business teams within 6 months"
        ]
    }


def _mock_requirements() -> list[dict]:
    """Return realistic mock data requirements."""
    return [
        {
            "business_entity": "Customer Profile",
            "data_points": [
                "Customer ID (unified)", "Email", "Phone", "Demographics (age, location, segment)",
                "Account creation date", "Subscription tier", "Lifetime value score",
                "Communication preferences", "Consent flags"
            ],
            "source_systems": ["CRM (Salesforce)", "Billing System", "Auth0 Identity Platform"],
            "dependencies": ["Identity resolution service must be operational", "Consent management platform integration"],
            "gaps": [
                "No unified customer ID exists today — identity resolution needed",
                "Consent records are incomplete for pre-2022 customers"
            ],
            "priority": "critical"
        },
        {
            "business_entity": "Transaction History",
            "data_points": [
                "Transaction ID", "Customer ID", "Product/SKU", "Amount", "Currency",
                "Timestamp", "Channel (web/mobile/store)", "Payment method",
                "Discount/promo code applied", "Refund status"
            ],
            "source_systems": ["Payment Gateway (Stripe)", "E-commerce Platform", "POS System"],
            "dependencies": ["Customer Profile entity must be resolved first", "Currency normalization rules"],
            "gaps": [
                "POS transactions older than 18 months are in a legacy format requiring migration",
                "No standardized product taxonomy across channels"
            ],
            "priority": "high"
        },
        {
            "business_entity": "Customer Interactions",
            "data_points": [
                "Interaction ID", "Customer ID", "Channel", "Type (support/sales/marketing)",
                "Timestamp", "Duration", "Sentiment score", "Resolution status",
                "Agent ID", "CSAT score"
            ],
            "source_systems": ["Zendesk", "Intercom", "Marketing Automation (HubSpot)"],
            "dependencies": ["Customer Profile for ID resolution", "NLP sentiment analysis pipeline"],
            "gaps": [
                "Chat transcripts from Intercom lack structured metadata",
                "No sentiment analysis capability exists today — needs ML pipeline"
            ],
            "priority": "high"
        },
        {
            "business_entity": "Product Usage Analytics",
            "data_points": [
                "Session ID", "Customer ID", "Feature used", "Time spent",
                "Actions performed", "Errors encountered", "Device/browser info",
                "Funnel stage", "Conversion events"
            ],
            "source_systems": ["Mixpanel", "Custom event tracking (Segment)"],
            "dependencies": ["Segment integration must be complete", "Event taxonomy agreement across product teams"],
            "gaps": [
                "Mobile app events are tracked separately with different schema",
                "No server-side event tracking — only client-side, which misses ~15% of events"
            ],
            "priority": "medium"
        },
        {
            "business_entity": "Churn Prediction Model Features",
            "data_points": [
                "Days since last login", "Support ticket frequency (30/60/90 day)",
                "Payment failure count", "Feature adoption score",
                "NPS response history", "Contract renewal date",
                "Competitor mention in support tickets", "Usage trend (declining/stable/growing)"
            ],
            "source_systems": ["Derived from Customer Profile + Interactions + Usage Analytics"],
            "dependencies": ["All upstream entities must be available", "ML feature store infrastructure"],
            "gaps": [
                "Feature store does not exist — needs to be built",
                "Historical labeled churn data needs validation by Customer Success team"
            ],
            "priority": "medium"
        }
    ]


def _mock_delivery_plan() -> list[dict]:
    """Return realistic mock delivery plan (epics > features > stories)."""
    return [
        {
            "type": "epic",
            "title": "Customer Data Unification Platform",
            "description": "Build the foundational data infrastructure to create a unified customer view by integrating data from CRM, billing, and identity systems.",
            "priority": "critical",
            "features": [
                {
                    "type": "feature",
                    "title": "Identity Resolution Service",
                    "description": "Implement a service that matches and merges customer records across source systems using deterministic and probabilistic matching.",
                    "priority": "critical",
                    "linked_requirement_ids": [],
                    "stories": [
                        {
                            "type": "story",
                            "title": "Deterministic matching on email and phone",
                            "description": "As a data engineer, I want to match customer records using exact email and phone matches so that we establish a baseline unified ID.",
                            "acceptance_criteria": [
                                "Given records from CRM and Billing with matching email, When the resolution runs, Then a single unified customer ID is created",
                                "Given duplicate phone numbers, When the resolution runs, Then records are merged with conflict resolution rules applied",
                                "Match rate >= 75% of total customer records on first pass"
                            ],
                            "priority": "critical"
                        },
                        {
                            "type": "story",
                            "title": "Probabilistic matching for remaining records",
                            "description": "As a data engineer, I want to use fuzzy matching (name similarity, address proximity) so that we resolve the remaining unmatched 25% of records.",
                            "acceptance_criteria": [
                                "Given unmatched records, When probabilistic matching runs, Then candidates with >85% confidence are auto-merged",
                                "Candidates with 60-85% confidence are flagged for manual review",
                                "False positive rate < 2%"
                            ],
                            "priority": "high"
                        }
                    ]
                },
                {
                    "type": "feature",
                    "title": "Customer Profile Data Pipeline",
                    "description": "ETL pipeline to extract, transform, and load customer profile data from source systems into the unified data store.",
                    "priority": "critical",
                    "linked_requirement_ids": [],
                    "stories": [
                        {
                            "type": "story",
                            "title": "CRM data extraction and transformation",
                            "description": "As a data engineer, I want to extract customer profiles from Salesforce and transform them into the canonical schema so that CRM data flows into the unified store.",
                            "acceptance_criteria": [
                                "Salesforce API connector extracts all customer fields nightly",
                                "Data conforms to canonical customer schema with validation checks",
                                "Pipeline completes within 2-hour SLA window",
                                "Failed records are quarantined with error details for remediation"
                            ],
                            "priority": "critical"
                        },
                        {
                            "type": "story",
                            "title": "Consent flag synchronization",
                            "description": "As a compliance officer, I want consent flags from all systems synchronized so that the platform respects data processing permissions.",
                            "acceptance_criteria": [
                                "Consent flags from CRM, Billing, and Auth0 are unified",
                                "Most restrictive consent applies when flags conflict",
                                "Consent changes propagate within 15 minutes",
                                "Audit log records all consent state changes"
                            ],
                            "priority": "critical"
                        }
                    ]
                }
            ]
        },
        {
            "type": "epic",
            "title": "Analytics & Insights Engine",
            "description": "Build the analytical layer that transforms unified customer data into actionable business insights, segmentation, and predictions.",
            "priority": "high",
            "features": [
                {
                    "type": "feature",
                    "title": "Customer Segmentation Engine",
                    "description": "Implement dynamic customer segmentation based on behavior, value, and engagement patterns.",
                    "priority": "high",
                    "linked_requirement_ids": [],
                    "stories": [
                        {
                            "type": "story",
                            "title": "RFM segmentation model",
                            "description": "As a marketing analyst, I want customers segmented by Recency, Frequency, and Monetary value so that I can target campaigns by segment.",
                            "acceptance_criteria": [
                                "RFM scores calculated daily for all active customers",
                                "At least 5 distinct segments identified with clear boundaries",
                                "Segment assignments accessible via API for downstream systems",
                                "Historical segment transitions tracked for trend analysis"
                            ],
                            "priority": "high"
                        },
                        {
                            "type": "story",
                            "title": "Self-service segment builder",
                            "description": "As a marketing manager, I want to create custom segments using a visual builder so that I can define audiences without engineering support.",
                            "acceptance_criteria": [
                                "Drag-and-drop interface for combining customer attributes",
                                "Real-time audience size estimation as filters are applied",
                                "Segments can be saved, shared, and scheduled for refresh",
                                "Export segment to marketing automation platform (HubSpot)"
                            ],
                            "priority": "medium"
                        }
                    ]
                },
                {
                    "type": "feature",
                    "title": "Churn Prediction Pipeline",
                    "description": "ML pipeline that predicts customer churn probability and identifies key risk drivers.",
                    "priority": "high",
                    "linked_requirement_ids": [],
                    "stories": [
                        {
                            "type": "story",
                            "title": "Feature engineering pipeline",
                            "description": "As a data scientist, I want an automated feature engineering pipeline so that ML models receive consistent, up-to-date input features.",
                            "acceptance_criteria": [
                                "Feature store populated with 20+ engineered features per customer",
                                "Features refresh daily with < 4-hour lag",
                                "Feature drift monitoring alerts when distributions shift >2 std devs",
                                "Feature lineage documented and queryable"
                            ],
                            "priority": "high"
                        },
                        {
                            "type": "story",
                            "title": "Churn prediction model training and deployment",
                            "description": "As a data scientist, I want to train and deploy a churn prediction model so that Customer Success can proactively engage at-risk customers.",
                            "acceptance_criteria": [
                                "Model AUC-ROC >= 0.82 on holdout test set",
                                "Predictions generated daily for all active customers",
                                "Top churn drivers (SHAP values) provided per customer",
                                "Model retraining triggered automatically when performance degrades below threshold"
                            ],
                            "priority": "high"
                        }
                    ]
                }
            ]
        },
        {
            "type": "epic",
            "title": "Cross-sell Recommendation Engine",
            "description": "Data-driven recommendation system that identifies and serves personalized cross-sell and upsell opportunities.",
            "priority": "medium",
            "features": [
                {
                    "type": "feature",
                    "title": "Product Affinity Analysis",
                    "description": "Analyze purchase patterns to identify product affinities and build recommendation models.",
                    "priority": "medium",
                    "linked_requirement_ids": [],
                    "stories": [
                        {
                            "type": "story",
                            "title": "Market basket analysis pipeline",
                            "description": "As a revenue analyst, I want automated market basket analysis so that we understand which products are frequently purchased together.",
                            "acceptance_criteria": [
                                "Association rules generated from 3 years of transaction data",
                                "Minimum support threshold of 1% and confidence of 50%",
                                "Results updated weekly and accessible via dashboard",
                                "Product pair recommendations ranked by lift score"
                            ],
                            "priority": "medium"
                        },
                        {
                            "type": "story",
                            "title": "Personalized recommendation API",
                            "description": "As a product manager, I want an API that returns personalized product recommendations so that our app and email campaigns can serve relevant offers.",
                            "acceptance_criteria": [
                                "API returns top 5 recommendations per customer in < 200ms",
                                "Recommendations consider purchase history, browsing behavior, and segment",
                                "API supports filtering by product category and exclusion lists",
                                "A/B test framework integrated for measuring recommendation effectiveness"
                            ],
                            "priority": "medium"
                        }
                    ]
                }
            ]
        }
    ]


def _mock_impact_analysis(change_description: str) -> dict:
    """Return realistic mock impact analysis."""
    return {
        "impacted_kpis": [
            {
                "kpi_name": "Customer Lifetime Value (CLV)",
                "impact": "moderate",
                "explanation": "Changing the data refresh frequency will affect the accuracy of CLV predictions, potentially causing a 5-10% variance in short-term estimates."
            },
            {
                "kpi_name": "Data Freshness",
                "impact": "high",
                "explanation": "Directly impacts the data freshness SLA — moving from real-time to batch processing changes the target from <15 minutes to <4 hours."
            },
            {
                "kpi_name": "Cross-sell Conversion Rate",
                "impact": "low",
                "explanation": "Recommendation model uses daily features, so batch processing will have minimal impact on conversion rates."
            }
        ],
        "impacted_requirements": [
            {
                "requirement": "Customer Profile",
                "impact": "high",
                "explanation": "Profile updates will be delayed, affecting downstream consumers. Consent flag synchronization SLA of 15 minutes cannot be met with batch processing."
            },
            {
                "requirement": "Customer Interactions",
                "impact": "moderate",
                "explanation": "Interaction data lag will increase, but sentiment analysis pipeline already runs on a 1-hour batch, so net impact is moderate."
            }
        ],
        "impacted_stories": [
            {
                "story": "Consent flag synchronization",
                "impact": "critical",
                "explanation": "The 15-minute consent propagation acceptance criterion cannot be met. Story needs to be renegotiated with compliance stakeholders."
            },
            {
                "story": "Real-time audience size estimation",
                "impact": "moderate",
                "explanation": "Audience size estimates will reflect data up to 4 hours old instead of real-time. UX copy should set this expectation."
            }
        ],
        "risk_assessment": (
            "MEDIUM-HIGH RISK. The proposed change reduces infrastructure complexity and cost by ~30%, "
            "but introduces compliance risk around consent synchronization (GDPR Article 7 requires 'without undue delay'). "
            "Recommend: (1) Keep consent data on a real-time pipeline even if other data moves to batch. "
            "(2) Update SLA documentation and communicate to stakeholders. "
            "(3) Re-run churn model validation after 2 weeks of batch data to verify prediction accuracy is maintained."
        ),
        "recommendations": [
            "Implement a hybrid approach: real-time pipeline for consent and critical events, batch for everything else",
            "Update Data Freshness KPI target to reflect the new architecture (< 15 min for consent, < 4 hours for analytics)",
            "Schedule a stakeholder review meeting to discuss SLA changes with Compliance and Customer Success",
            "Add a data staleness indicator to the analytics dashboard so users understand data recency",
            "Create a rollback plan in case churn prediction accuracy degrades beyond acceptable threshold"
        ]
    }


# ---------------------------------------------------------------------------
# ClaudeService
# ---------------------------------------------------------------------------

class ClaudeService:
    """Orchestrates Claude API calls for discovery, requirements, delivery, and impact analysis."""

    async def extract_discovery(self, raw_text: str) -> dict:
        """Extract structured business discovery data from raw meeting notes or transcript.

        Returns dict with: business_objectives, stakeholders, kpis, assumptions, risks, success_metrics.
        """
        client = _get_client()
        if client is None:
            return _mock_discovery()

        system_prompt = """You are a Senior Business Analyst at a top-tier consulting firm. Your expertise is in
extracting structured, actionable insights from unstructured business conversations, meeting notes, and transcripts.

Your task is to analyze the provided text and extract a comprehensive discovery document. Be thorough but precise.
Do not invent information that isn't present or strongly implied in the text.

Return your analysis as a JSON object with exactly these keys:
- business_objectives: array of objects with {name, description}
- stakeholders: array of objects with {name, role, interest}
- kpis: array of objects with {name, description, target, measurement}
- assumptions: array of strings
- risks: array of strings
- success_metrics: array of strings

Return ONLY valid JSON. No markdown, no explanation, just the JSON object."""

        user_prompt = f"Analyze the following text and extract a structured business discovery:\n\n{raw_text}"

        response_text = _call_claude(system_prompt, user_prompt, temperature=0.3)
        if not response_text:
            return _mock_discovery()

        try:
            return _parse_json_from_response(response_text)
        except (json.JSONDecodeError, ValueError):
            return _mock_discovery()

    async def generate_data_requirements(self, discoveries: list[dict]) -> list[dict]:
        """Generate data requirements from extracted discoveries.

        Returns list of dicts with: business_entity, data_points, source_systems, dependencies, gaps, priority.
        """
        client = _get_client()
        if client is None:
            return _mock_requirements()

        system_prompt = """You are a Senior Data Analyst specializing in data product requirements. Your expertise is
mapping business needs to concrete data requirements — identifying what data is needed, where it comes from,
what's missing, and how to prioritize.

Given the business discoveries below, generate a comprehensive list of data requirements. Each requirement
should represent a logical business entity or data domain.

Return a JSON array where each element has:
- business_entity: string — the name of the data entity/domain
- data_points: array of strings — specific data fields/attributes needed
- source_systems: array of strings — where this data currently lives
- dependencies: array of strings — what this data depends on
- gaps: array of strings — what's missing or needs to be built
- priority: string — "critical", "high", "medium", or "low"

Return ONLY valid JSON. No markdown, no explanation, just the JSON array."""

        discoveries_text = json.dumps(discoveries, indent=2)
        user_prompt = f"Generate data requirements from these business discoveries:\n\n{discoveries_text}"

        response_text = _call_claude(system_prompt, user_prompt, temperature=0.3)
        if not response_text:
            return _mock_requirements()

        try:
            result = _parse_json_from_response(response_text)
            return result if isinstance(result, list) else [result]
        except (json.JSONDecodeError, ValueError):
            return _mock_requirements()

    async def generate_delivery_plan(self, requirements: list[dict], discoveries: list[dict]) -> list[dict]:
        """Generate a hierarchical delivery plan from data requirements and discoveries.

        Returns list of epic dicts, each containing features, each containing stories with acceptance criteria.
        """
        client = _get_client()
        if client is None:
            return _mock_delivery_plan()

        system_prompt = """You are a Delivery Lead and Agile Coach with deep experience in data product delivery.
Your task is to create a comprehensive, actionable delivery plan organized as Epics > Features > User Stories.

Guidelines:
- Each Epic represents a major capability or workstream
- Features are deliverable increments within an Epic
- Stories follow "As a [role], I want [capability] so that [benefit]" format
- Every story must have specific, testable acceptance criteria (Given/When/Then preferred)
- Prioritize: critical items first, then high, medium, low
- Consider dependencies between items

Return a JSON array of Epics, where each Epic has:
- type: "epic"
- title: string
- description: string
- priority: "critical" | "high" | "medium" | "low"
- features: array of Feature objects
  - type: "feature"
  - title: string
  - description: string
  - priority: string
  - linked_requirement_ids: array (empty for now)
  - stories: array of Story objects
    - type: "story"
    - title: string
    - description: string (As a... I want... so that...)
    - acceptance_criteria: array of strings
    - priority: string

Return ONLY valid JSON. No markdown, no explanation, just the JSON array."""

        context = json.dumps({"discoveries": discoveries, "requirements": requirements}, indent=2)
        user_prompt = f"Generate a delivery plan from these discoveries and data requirements:\n\n{context}"

        response_text = _call_claude(system_prompt, user_prompt, temperature=0.5)
        if not response_text:
            return _mock_delivery_plan()

        try:
            result = _parse_json_from_response(response_text)
            return result if isinstance(result, list) else [result]
        except (json.JSONDecodeError, ValueError):
            return _mock_delivery_plan()

    async def analyze_impact(self, change_description: str, current_state: dict) -> dict:
        """Analyze the impact of a proposed change on the current workspace state.

        Returns dict with: impacted_kpis, impacted_requirements, impacted_stories, risk_assessment, recommendations.
        """
        client = _get_client()
        if client is None:
            return _mock_impact_analysis(change_description)

        system_prompt = """You are a Senior Business Analyst performing change impact analysis. You have deep
expertise in traceability and understanding how changes ripple through a data product ecosystem.

Given a proposed change and the current state of the project (discoveries, data requirements, delivery artifacts),
analyze the impact comprehensively.

Return a JSON object with:
- impacted_kpis: array of {kpi_name, impact ("critical"|"high"|"moderate"|"low"), explanation}
- impacted_requirements: array of {requirement, impact, explanation}
- impacted_stories: array of {story, impact, explanation}
- risk_assessment: string — overall risk assessment paragraph
- recommendations: array of strings — actionable recommendations

Be specific. Reference actual items from the current state. Don't be generic.

Return ONLY valid JSON. No markdown, no explanation, just the JSON object."""

        context = json.dumps(current_state, indent=2)
        user_prompt = (
            f"Analyze the impact of the following change:\n\n"
            f"PROPOSED CHANGE: {change_description}\n\n"
            f"CURRENT PROJECT STATE:\n{context}"
        )

        response_text = _call_claude(system_prompt, user_prompt, temperature=0.3)
        if not response_text:
            return _mock_impact_analysis(change_description)

        try:
            return _parse_json_from_response(response_text)
        except (json.JSONDecodeError, ValueError):
            return _mock_impact_analysis(change_description)


# Singleton instance
claude_service = ClaudeService()
