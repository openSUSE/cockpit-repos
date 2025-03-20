import React, { Dispatch } from "react";
import { Button, Modal } from "@patternfly/react-core";
import { useDialogs } from "dialogs";
import { Backend } from "../backends/backend";

import cockpit, { Spawn } from "cockpit.js";
import { EmptyStatePanel } from "cockpit-components-empty-state";

const _ = cockpit.gettext;

interface UknownRefresh {
    err: "unknown";
}

interface LockedRefresh {
    err: "locked";
    message: string;
}

interface UntrustedRefresh {
    err: "untrusted";
    repos: string[];
}

interface InvalidRefresh {
    err: "invalid";
    reason: string,
    repos: string[];
}

type RefreshError = UknownRefresh | LockedRefresh | UntrustedRefresh | InvalidRefresh;

const OkFooter = () => {
    const Dialogs = useDialogs();
    return (
        <Button
            variant="primary"
            onClick={() => Dialogs.close()}
        >
            {_("Ok")}
        </Button>
    );
};

const ErrorFooter = ({
    backend,
    error,
    refreshing,
    setRefreshing,
    setLoading,
    onLoaded,
}: {
    backend: Backend,
    error: RefreshError,
    refreshing: Spawn<string> | null
    setRefreshing: Dispatch<Spawn<string> | null>,
    setLoading: () => void,
    onLoaded: (err: RefreshError | null) => void
}) => {
    const Dialogs = useDialogs();

    const untrustedButton = (
        <Button
            variant="danger"
            onClick={() => {
                setLoading();
                const refresh = backend.refreshRepo(null, true);

                refresh.then(() => {
                    onLoaded(null);
                    setRefreshing(null);
                })
                                .catch(reason => {
                                    console.warn(reason);
                                    onLoaded({ err: "unknown" });
                                });
                setRefreshing(refresh);
            }}
        >
            {_("Trust")}
        </Button>
    );

    return (
        <>
            { error.err === "untrusted"
                ? untrustedButton
                : <Button variant="primary" onClick={() => Dialogs.close()}>{_("Okay")}</Button>}
            <Button
                variant="link"
                className="btn-cancel"
                onClick={() => {
                    if (refreshing) {
                        refreshing.close("terminated");
                    }
                    Dialogs.close();
                }}
            >
                {_("Cancel")}
            </Button>
        </>
    );
};

const ErrorMsg = ({ error }: { error: RefreshError }) => {
    if (error.err === "untrusted") {
        return (
            <>
                <p>{_("Couldn't trust following repos:")}</p>
                {error.repos.map((err, idx) => <p key={idx}>{err}</p>)}
                <br />
                <p>{_("You can trust them, or run \"zypper ref\" as root in console to see more information about the issue")}</p>
            </>
        );
    } else if (error.err === "invalid") {
        return (
            <>
                <p>{_("Couldn't refresh the following repos:")}</p>
                {error.repos.map((err, idx) => <p key={idx}>{err}</p>)}
                <br />
                <p>For Reason:</p>
                <pre>
                    {error.reason}
                </pre>
            </>
        );
    } else if (error.err === "locked") {
        return (
            <p>{error.message}</p>
        );
    } else {
        return (
            <>
                <p>{_("Unknown error occured.")}</p>
                <p>{_("See \"zypper ref\" for more information.")}</p>
            </>
        );
    }
};

const RefreshDialog = ({ backend }: { backend: Backend }) => {
    const Dialogs = useDialogs();
    const [refreshing, setRefreshing] = React.useState(true);
    const [refreshProcess, setRefreshProcess] = React.useState<Spawn<string> | null>(null);
    const [error, setError] = React.useState<RefreshError | null>(null);

    const parseError = (error: string): RefreshError => {
        console.log(error);
        const parser = new DOMParser();
        const doc = parser.parseFromString(error, "text/xml");
        const errorMessage = doc.documentElement.querySelector("message[type*='error']");
        const regex = /\[(.+?)\|.*?\]/gm;
        const errorRegex = /Error message: (.*?)$/gm;
        const lines = (errorMessage?.textContent || "").replace("\\n", "\n");
        const errorMatch = errorRegex.exec(errorMessage?.textContent || "");
        let match;
        let repoNames: string[] = [];

        while ((match = regex.exec(lines)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            repoNames.push(match[1]);
        }

        if ((errorMessage?.textContent || "").includes(" is invalid.") && errorMatch) {
            return { err: "invalid", reason: errorMatch[1], repos: repoNames };
        }

        if (error.includes("New repository or package signing key received")) {
            repoNames = [];
            const errorMessages = doc.documentElement.querySelectorAll("message[type*='error']");
            const repoRegex = /'(.*?)'/;
            errorMessages.forEach((error_message) => {
                if ((error_message.textContent || "").includes("Skipping repository")) {
                    const repoName = repoRegex.exec(error_message.textContent || "");

                    if (repoName)
                        repoNames.push(repoName[1]);
                }
            });

            return { err: "untrusted", repos: repoNames };
        }

        if (error.includes("is blocking zypper")) {
            return { err: "locked", message: doc.documentElement.querySelector("message[type*='info']").textContent || "" };
        }

        return { err: "unknown" };
    };

    React.useEffect(() => {
        const refresh = backend.refreshRepo(null);
        refresh.catch((_: string, reason: string) => { setError(parseError(reason)) })
                        .finally(() => {
                            setRefreshing(false);
                            setRefreshProcess(null);
                        });
        setRefreshProcess(refresh);
    }, [backend, setError, setRefreshing]);

    return (
        <Modal
            title={_("Refreshing repositories")}
            variant="small"
            onClose={() => {
                if (refreshProcess) {
                    refreshProcess.close();
                }
                Dialogs.close();
            }}
            isOpen
            footer={
                refreshing
                    ? null
                    : error
                        ? <ErrorFooter backend={backend} error={error} setLoading={() => setRefreshing(true)} onLoaded={(err) => { setRefreshing(false); setError(err) } } refreshing={refreshProcess} setRefreshing={setRefreshProcess} />
                        : <OkFooter />
            }
        >
            {refreshing
                ? <EmptyStatePanel loading />
                : error ? <ErrorMsg error={error} /> : <p>{_("Refreshing repos was successful")}</p>}
        </Modal>
    );
};

export const RefreshAllButton = ({ backend }: { backend: Backend }) => {
    const Dialogs = useDialogs();

    const refreshAll = () => {
        Dialogs.show(<RefreshDialog backend={backend} />);
    };

    return (
        <Button
            variant="secondary"
            id="settings-button"
            onClick={refreshAll}
        >
            {_("Refresh repositories")}
        </Button>
    );
};
