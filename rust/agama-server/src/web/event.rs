use crate::l10n::web::LocaleConfig;
use agama_lib::{manager::InstallationPhase, progress::Progress, software::SelectedBy};
use serde::Serialize;
use std::collections::HashMap;
use tokio::sync::broadcast::{Receiver, Sender};

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type")]
pub enum Event {
    L10nConfigChanged(LocaleConfig),
    LocaleChanged { locale: String },
    Progress(Progress),
    ProductChanged { id: String },
    PatternsChanged(HashMap<String, SelectedBy>),
    InstallationPhaseChanged { phase: InstallationPhase },
    BusyServicesChanged { services: Vec<String> },
    StatusChanged { status: u32 },
}

pub type EventsSender = Sender<Event>;
pub type EventsReceiver = Receiver<Event>;
