import React, { useContext } from "react";
import { Backend, Repo } from "../backends/backend";
import { ListingTable } from "cockpit-components-table.jsx";
import { KebabDropdown } from "cockpit-components-dropdown";

import cockpit from "cockpit";
import { DropdownItem } from "@patternfly/react-core";
import { useDialogs } from "dialogs";
import { BanIcon, CheckIcon } from "@patternfly/react-icons";
import { RepoDialog } from "./repo_dialog";
import { RepoChangesContext } from "../app";
import { ConfirmationDialog } from "./confirmation_dialog";

const _ = cockpit.gettext;

type Props = {
  repos: Repo[];
  backend: Backend;
};

export const RepoList = ({ repos, backend }: Props) => {
    const columns = [
        { title: _("Name") },
        { title: _("Priority") },
        { title: _("GPG Check") },
        { title: _("Autorefresh") },
        { title: _("Enabled") },
    ];

    return (
        <ListingTable
      columns={columns}
      id="repos-list"
      isEmptyStateInTable={repos.length > 0}
      rows={repos.map((repo) => {
          return {
              columns: [
                  {
                      title: repo.name,
                  },
                  {
                      title: repo.priority,
                      props: { width: 10 },
                  },
                  {
                      title: repo.gpgcheck ? <CheckIcon /> : <BanIcon />,
                      props: { width: 10 },
                  },
                  {
                      title: repo.autorefresh ? <CheckIcon /> : <BanIcon />,
                      props: { width: 10 },
                  },
                  {
                      title: repo.enabled ? <CheckIcon /> : <BanIcon />,
                      props: { width: 10 },
                  },
                  {
                      title: <RepoActions backend={backend} repo={repo} />,
                      props: { className: "pf-v5-c-table__action" },
                  },
              ],
              props: { key: repo.alias },
          };
      })}
      loading={repos.length ? "" : _("Loading...")}
      variant="compact"
        />
    );
};

const RepoActions = ({ backend, repo }: { backend: Backend; repo: Repo }) => {
    const Dialogs = useDialogs();
    const { reposChanged, setReposChanged } = useContext(RepoChangesContext);

    const actions = [
        <DropdownItem
      key="edit-repo"
      onClick={() => Dialogs.show(<RepoDialog backend={backend} repo={repo} />)}
        >
            {_("Edit repo")}
        </DropdownItem>,
        <DropdownItem
      key="delete-repo"
      onClick={() => {
        Dialogs.show(<ConfirmationDialog title={cockpit.format(_("Delete $0?"), repo.name)} callback={() => {
          backend.deleteRepo(repo).then(() => {
              if (setReposChanged && reposChanged !== null)
                  setReposChanged(reposChanged + 1);
          });
        }}/>)
      }}
        >
            {_("Delete repo")}
        </DropdownItem>,
    ];

    return (
        <KebabDropdown toggleButtonId="repos-actions" dropdownItems={actions} />
    );
};
