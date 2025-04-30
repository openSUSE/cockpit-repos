import React, { Dispatch } from "react";
import { Button, Modal, ModalFooter, ModalHeader } from "@patternfly/react-core";
import { useDialogs } from "dialogs";
import { Backend, RefreshError } from "../backends/backend";

import cockpit, { Spawn } from "cockpit.js";
import { EmptyStatePanel } from "cockpit-components-empty-state";

const _ = cockpit.gettext;

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

const RefreshDialog = ({ backend }: { backend: Backend }) => {
    const Dialogs = useDialogs();
    const [refreshing, setRefreshing] = React.useState(true);
    const [refreshProcess, setRefreshProcess] = React.useState<Spawn<string> | null>(null);
    const [error, setError] = React.useState<RefreshError | null>(null);

    React.useEffect(() => {
        const refresh = backend.refreshRepo(null);
        refresh.catch((_: string, reason: string) => { setError(backend.parseError(reason)) })
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
        >
            <ModalHeader>
                {refreshing
                    ? <EmptyStatePanel loading />
                    : error ? backend.getErrorMsg(error) : <p>{_("Refreshing repos was successful")}</p>}
            </ModalHeader>
            <ModalFooter>
                {
                    refreshing
                        ? null
                        : error
                            ? <ErrorFooter backend={backend} error={error} setLoading={() => setRefreshing(true)} onLoaded={(err) => { setRefreshing(false); setError(err) } } refreshing={refreshProcess} setRefreshing={setRefreshProcess} />
                            : <OkFooter />
                }
            </ModalFooter>
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
