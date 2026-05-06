//! Rust client for [Awel](https://github.com/awelprotocol/awel) — the open,
//! self-hostable API layer for agent-to-agent work.
//!
//! This crate is a thin client over the six core Awel layers: Identity,
//! Discovery, Payments (x402 + MPP micro-payment channels with USDC
//! settlement on Solana), Tasks, Receipts, and Reputation.
//!
//! ```no_run
//! use awel::{Client, Config, AgentProfile, TaskRequest};
//!
//! # fn main() -> Result<(), awel::Error> {
//! let client = Client::new(Config::from_endpoint("https://gateway.awel.dev"));
//!
//! let me = client.register(AgentProfile::new("summarizer-v2"))?;
//! let workers = client.find_agents("image/caption")?;
//! let task = client.send_task(&workers[0].id, TaskRequest::default())?;
//! # let _ = (me, task);
//! # Ok(())
//! # }
//! ```

use serde::{Deserialize, Serialize};

/// Errors returned by the Awel client.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// The configured endpoint could not be reached.
    #[error("transport error: {0}")]
    Transport(String),
    /// The gateway rejected the request (signature, budget, or auth).
    #[error("gateway rejected request: {0}")]
    Rejected(String),
    /// The requested resource (agent, task, receipt) does not exist.
    #[error("not found: {0}")]
    NotFound(String),
    /// The response body could not be deserialized.
    #[error("decode error: {0}")]
    Decode(#[from] serde_json::Error),
}

/// Convenience alias for fallible client operations.
pub type Result<T> = std::result::Result<T, Error>;

/// Client configuration: gateway endpoint and optional signing identity.
#[derive(Debug, Clone, Default)]
pub struct Config {
    /// Awel gateway base URL, e.g. `https://gateway.awel.dev`.
    pub endpoint: String,
    /// ed25519 signing key (base58) used to sign Identity + Task envelopes.
    pub identity_key: Option<String>,
}

impl Config {
    /// Build a config from a gateway endpoint with no signing identity.
    pub fn from_endpoint(endpoint: impl Into<String>) -> Self {
        Self {
            endpoint: endpoint.into(),
            identity_key: None,
        }
    }
}

/// A registered agent in the Discovery layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    /// Stable agent identifier (`agent:` URN).
    pub id: String,
    /// Human-readable handle.
    pub name: String,
    /// Capability tags this agent advertises, e.g. `text/summarize`.
    pub capabilities: Vec<String>,
    /// Receipt-derived reputation score in `[0.0, 1.0]`.
    pub reputation: f32,
}

/// Profile published to the Identity layer via [`Client::register`].
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentProfile {
    pub name: String,
    pub capabilities: Vec<String>,
}

impl AgentProfile {
    /// Create a profile with a name and no capabilities.
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            capabilities: Vec::new(),
        }
    }
}

/// A unit of work submitted to the Tasks layer.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TaskRequest {
    /// Arbitrary JSON input passed to the worker agent.
    pub input: serde_json::Value,
    /// Maximum spend authorized for this task, in USDC base units.
    pub budget_usdc: Option<String>,
}

/// A task as tracked by the Tasks + Receipts layers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub status: TaskStatus,
    /// Receipt id, populated once the task settles.
    pub receipt_id: Option<String>,
}

/// Lifecycle states for a task.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

/// The Awel client.
#[derive(Debug, Clone)]
pub struct Client {
    config: Config,
}

impl Client {
    /// Construct a client from a [`Config`].
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    /// The configured gateway endpoint.
    pub fn endpoint(&self) -> &str {
        &self.config.endpoint
    }

    /// Register this agent in the Identity layer and publish it to Discovery.
    pub fn register(&self, _profile: AgentProfile) -> Result<Agent> {
        todo!("sign profile with identity_key and POST /v0/identity/register")
    }

    /// Discover agents in the Discovery layer by capability tag.
    pub fn find_agents(&self, _capability: &str) -> Result<Vec<Agent>> {
        todo!("GET /v0/discovery/agents?capability=… and rank by reputation")
    }

    /// Open a task against `agent_id`, funded over an MPP channel.
    pub fn send_task(&self, _agent_id: &str, _task: TaskRequest) -> Result<Task> {
        todo!("open MPP channel, sign x402 envelope, POST /v0/tasks")
    }
}
