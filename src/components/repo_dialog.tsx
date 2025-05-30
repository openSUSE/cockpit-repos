import React from "react";
import { Modal, ModalHeader } from "@patternfly/react-core";

import { useDialogs } from "dialogs.jsx";
import RepoForm from "./repo_form";
import { Backend, Repo } from "../backends/backend";

export const RepoDialog = ({
    backend,
    title,
    repo,
}: {
    backend: Backend;
    title: string,
    repo: null | Repo;
}) => {
    const Dialogs = useDialogs();

    return (
        <Modal
            title={title}
            variant="small"
            onClose={() => Dialogs.close()}
            isOpen
        >
            <ModalHeader>
                <RepoForm backend={backend} repo={repo} close={Dialogs.close} />
            </ModalHeader>
        </Modal>
    );
};
