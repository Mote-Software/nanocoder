import React, {useEffect, useState} from 'react';
import {toolRegistry} from '../tools/index.js';
import InfoMessage from './info-message.js';
import SuccessMessage from './success-message.js';
import ErrorMessage from './error-message.js';
import {checkForUpdates} from '../utils/update-checker.js';

enum Status {
	Checking = 'checking',
	Updating = 'updating',
	NoUpdate = 'no-update',
	Success = 'success',
	Error = 'error',
}

export default function UpdateMessage() {
	const [status, setStatus] = useState<Status>(Status.Checking);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isMounted = true;

		const check = async () => {
			try {
				const updateInfo = await checkForUpdates();
				if (isMounted) {
					if (updateInfo.hasUpdate) {
						setStatus(Status.Updating);
						update();
					} else {
						setStatus(Status.NoUpdate);
					}
				}
			} catch (e) {
				if (isMounted) {
					setStatus(Status.Error);
					setError(e as Error);
				}
			}
		};

		const update = async () => {
			try {
				await toolRegistry.execute_bash({
					command: 'npm update -g @motesoftware/nanocoder',
				});
				if (isMounted) {
					setStatus(Status.Success);
				}
			} catch (e) {
				if (isMounted) {
					setStatus(Status.Error);
					setError(e as Error);
				}
			}
		};

		check();

		return () => {
			isMounted = false;
		};
	}, []);

	if (status === Status.Checking) {
		return React.createElement(InfoMessage, {
			message: 'Checking for available updates...',
		});
	}

	if (status === Status.Updating) {
		return React.createElement(InfoMessage, {
			message: 'Downloading and installing the latest Nanocoder update...',
		});
	}

	if (status === Status.NoUpdate) {
		return React.createElement(SuccessMessage, {
			message: 'Nanocoder is already up to date.',
		});
	}

	if (status === Status.Success) {
		return React.createElement(SuccessMessage, {
			message:
				'Nanocoder has been updated to the latest version. Please restart your session to apply the update.',
		});
	}

	if (status === Status.Error) {
		return React.createElement(ErrorMessage, {
			message: `Failed to update Nanocoder: ${error?.message}`,
		});
	}

	return null;
}
