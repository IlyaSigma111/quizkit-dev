use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Answer {
    pub id: String,
    pub text: String,
    pub is_correct: bool,
    pub color: String,
    pub shape: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Question {
    pub id: String,
    pub text: String,
    pub time_seconds: u32,
    pub points: u32,
    pub answers: Vec<Answer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quiz {
    pub id: String,
    pub title: String,
    pub description: String,
    pub questions: Vec<Question>,
    pub created_at: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub total_time_seconds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GameStatus {
    Lobby,
    Countdown,
    Active,
    Ended,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GameMode {
    Test,
    LiveQuiz,
    Jeopardy,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AdvanceMode {
    Auto,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub nickname: String,
    pub total_score: u32,
    pub streak: u32,
    pub joined_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerAnswer {
    pub player_id: String,
    pub question_index: usize,
    pub answer_index: usize,
    pub is_correct: bool,
    pub time_ms: u64,
    pub points_earned: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardyQuestionData {
    pub points: u32,
    pub text: String,
    pub answer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardyCategoryData {
    pub name: String,
    pub emoji: String,
    pub questions: Vec<JeopardyQuestionData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinalJeopardyData {
    pub text: String,
    pub answer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardySessionData {
    pub title: String,
    pub description: String,
    pub emoji: String,
    pub categories: Vec<JeopardyCategoryData>,
    pub final_jeopardy: Option<FinalJeopardyData>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum JeopardyBoardMode {
    Auto,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardyPendingAnswer {
    pub player_id: String,
    pub player_nick: String,
    pub answer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevealPlace {
    pub place: usize,
    pub player_id: String,
    pub nickname: String,
    pub score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardyHostStateData {
    pub phase: String,
    pub categories: Vec<JeopardyCategoryData>,
    pub answered_cells: Vec<(usize, usize)>,
    pub turn_order: Vec<String>,
    pub current_turn_idx: usize,
    pub current_player_id: String,
    pub current_player_nick: String,
    pub active_cell: Option<(usize, usize)>,
    pub pending_answer: Option<JeopardyPendingAnswer>,
    pub scores: HashMap<String, u32>,
    pub reveal_places: Vec<RevealPlace>,
    pub board_mode: JeopardyBoardMode,
    pub final_active: bool,
    pub final_text: Option<String>,
    pub final_answer: Option<String>,
    pub final_player_id: Option<String>,
    pub final_wagers: HashMap<String, u32>,
    pub final_answers: HashMap<String, String>,
    pub final_correct: HashMap<String, bool>,
    pub all_answered_count: usize,
    pub total_players: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardyPlayerStateData {
    pub phase: String,
    pub your_turn: bool,
    pub categories: Vec<JeopardyCategoryData>,
    pub answered_cells: Vec<(usize, usize)>,
    pub board_mode: JeopardyBoardMode,
    pub question_text: Option<String>,
    pub question_points: u32,
    pub cat_emoji: Option<String>,
    pub cat_name: Option<String>,
    pub correct: Option<bool>,
    pub points_earned: u32,
    pub final_question: Option<String>,
    pub final_answer: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JeopardyState {
    pub board_mode: JeopardyBoardMode,
    pub turn_order: Vec<String>,
    pub current_turn_idx: usize,
    pub answered_cells: Vec<(usize, usize)>,
    pub active_cell: Option<(usize, usize)>,
    pub stealing: bool,
    pub steal_idx: usize,
    pub pending_answer: Option<JeopardyPendingAnswer>,
    pub scores: HashMap<String, u32>,
    pub final_wagers: HashMap<String, u32>,
    pub final_answers: HashMap<String, String>,
    pub final_correct: HashMap<String, bool>,
    pub reveal_places: Vec<RevealPlace>,
    pub reveal_idx: usize,
    pub final_active: bool,
    pub final_player_idx: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSession {
    pub pin: String,
    pub quiz: Quiz,
    pub status: GameStatus,
    pub mode: GameMode,
    pub advance: AdvanceMode,
    pub current_question_index: usize,
    pub players: Vec<Player>,
    pub answers: Vec<PlayerAnswer>,
    pub player_progress: HashMap<String, usize>,
    pub question_start_time: u64,
    pub server_port: u16,
    #[serde(default)]
    pub jeopardy_data: Option<JeopardySessionData>,
    #[serde(default)]
    pub jeopardy_state: Option<JeopardyState>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    #[serde(rename = "lobby_joined")]
    LobbyJoined { player_id: String, nickname: String, players: Vec<Player> },
    #[serde(rename = "lobby_error")]
    LobbyError { error: String },
    #[serde(rename = "player_joined")]
    PlayerJoined { player: Player },
    #[serde(rename = "player_left")]
    PlayerLeft { player_id: String },
    #[serde(rename = "game_starting")]
    GameStarting { countdown: u32 },
    #[serde(rename = "question")]
    Question { question: QuestionData, total: usize, index: usize },
    #[serde(rename = "answer_result")]
    AnswerResult { correct: bool, points: u32, score: u32, correct_index: usize, show_next: bool },
    #[serde(rename = "round_results")]
    RoundResults { histogram: Vec<u32>, correct_index: usize, leaderboard: Vec<PlayerData>, next_in: u32 },
    #[serde(rename = "test_complete")]
    TestComplete { score: u32, total_questions: usize },
    #[serde(rename = "progress")]
    Progress { players: Vec<PlayerProgressItem> },
    #[serde(rename = "host_update")]
    HostUpdate { players: Vec<Player>, answered: usize, total_players: usize },
    #[serde(rename = "final_results")]
    FinalResults { leaderboard: Vec<PlayerData> },
    #[serde(rename = "server_info")]
    ServerInfo { ip: String, port: u16 },
    #[serde(rename = "style_update")]
    StyleUpdate { style: String, dark: bool },
    #[serde(rename = "test_start")]
    TestStart { questions: Vec<QuestionData>, total: usize, total_time_seconds: u32 },
    #[serde(rename = "jeopardy_host_state")]
    JeopardyHostState { state: JeopardyHostStateData },
    #[serde(rename = "jeopardy_player_state")]
    JeopardyPlayerState { state: JeopardyPlayerStateData },
    #[serde(rename = "jeopardy_result")]
    JeopardyResult { correct: bool, points: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnswerSubmission {
    pub question_index: usize,
    pub answer_index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestionData {
    pub text: String,
    pub time_seconds: u32,
    pub answers: Vec<AnswerData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnswerData {
    pub text: String,
    pub color: String,
    pub shape: String,
    pub index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerData {
    pub id: String,
    pub nickname: String,
    pub total_score: u32,
    pub rank: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerProgressItem {
    pub id: String,
    pub nickname: String,
    pub question_index: usize,
    pub total_questions: usize,
    pub score: u32,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "join")]
    Join { pin: String, nickname: String },
    #[serde(rename = "register_host")]
    RegisterHost { pin: String },
    #[serde(rename = "start_game")]
    StartGame { pin: String },
    #[serde(rename = "show_results")]
    ShowResults { pin: String },
    #[serde(rename = "submit_answer")]
    SubmitAnswer { pin: String, answer_index: usize },
    #[serde(rename = "next_question")]
    NextQuestion { pin: String },
    #[serde(rename = "end_game")]
    EndGame { pin: String },
    #[serde(rename = "submit_test")]
    SubmitTest { pin: String, answers: Vec<AnswerSubmission> },
    #[serde(rename = "jeopardy_open_cell")]
    JeopardyOpenCell { pin: String, cat_idx: usize, q_idx: usize },
    #[serde(rename = "jeopardy_select_cell")]
    JeopardySelectCell { pin: String, cat_idx: usize, q_idx: usize },
    #[serde(rename = "jeopardy_submit_answer")]
    JeopardySubmitAnswer { pin: String, answer: String },
    #[serde(rename = "jeopardy_judge")]
    JeopardyJudge { pin: String, correct: bool },
    #[serde(rename = "jeopardy_final_wager")]
    JeopardyFinalWager { pin: String, wager: u32 },
    #[serde(rename = "jeopardy_final_answer")]
    JeopardyFinalAnswer { pin: String, answer: String },
    #[serde(rename = "jeopardy_judge_final")]
    JeopardyJudgeFinal { pin: String, player_id: String, correct: bool },
    #[serde(rename = "jeopardy_reveal_next")]
    JeopardyRevealNext { pin: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default = "default_mode")]
    pub default_mode: String,
    #[serde(default = "default_advance")]
    pub default_advance: String,
    #[serde(default = "default_time_seconds")]
    pub default_time_seconds: u32,
    #[serde(default = "default_points")]
    pub default_points: u32,
    #[serde(default = "default_style")]
    pub style: String,
    #[serde(default)]
    pub dark_mode: bool,
}

fn default_mode() -> String { "test".to_string() }
fn default_advance() -> String { "auto".to_string() }
fn default_time_seconds() -> u32 { 30 }
fn default_points() -> u32 { 10 }
fn default_style() -> String { "editorial".to_string() }

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_mode: "test".to_string(),
            default_advance: "auto".to_string(),
            default_time_seconds: 30,
            default_points: 10,
            style: "editorial".to_string(),
            dark_mode: false,
        }
    }
}

pub struct AppState {
    pub sessions: RwLock<HashMap<String, GameSession>>,
    pub ws_senders: RwLock<HashMap<String, Vec<tokio::sync::mpsc::UnboundedSender<String>>>>,
    pub host_senders: RwLock<HashMap<String, Vec<tokio::sync::mpsc::UnboundedSender<String>>>>,
    pub ws_player_map: RwLock<HashMap<String, HashMap<String, usize>>>,
    pub server_port: RwLock<u16>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            sessions: RwLock::new(HashMap::new()),
            ws_senders: RwLock::new(HashMap::new()),
            host_senders: RwLock::new(HashMap::new()),
            ws_player_map: RwLock::new(HashMap::new()),
            server_port: RwLock::new(0),
        }
    }
}
