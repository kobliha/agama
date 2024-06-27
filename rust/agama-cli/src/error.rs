use inquire::InquireError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CliError {
    #[error("Cannot perform the installation as the settings are not valid")]
    ValidationError,
    #[error("Could not start the installation")]
    InstallationError,
    #[error("Could not read the password")]
    InteractivePassword(#[source] InquireError),
    #[error("Could not read the password from the standard input")]
    StdinPassword(#[source] std::io::Error),
}
