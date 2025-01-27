import React from "react";
import { Modal } from "@patternfly/react-core";
import cockpit from "cockpit";

import { useDialogs } from "dialogs.jsx";
import RepoForm from "./repo_form";
import { Backend, Repo } from "../backends/backend";

const _ = cockpit.gettext;

export const RepoDialog = ({
    backend,
    repo,
}: {
  backend: Backend;
  repo: null | Repo;
}) => {
    const Dialogs = useDialogs();

    return (
        <Modal
      title={_("Add a repo")}
      variant="small"
      onClose={Dialogs.close}
      isOpen
        >
            <RepoForm backend={backend} repo={repo} close={Dialogs.close} />
        </Modal>
    );
};
