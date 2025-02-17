import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    Card,
    CardBody,
    CardHeader,
    CardTitle,
} from "@patternfly/react-core/dist/esm/components/Card/index.js";

import cockpit from "cockpit";
import { Zypp } from "./backends/zypp";
import { Backend, Repo } from "./backends/backend";
import { RepoList } from "./components/repo_list";
import { Button } from "@patternfly/react-core";
import { useDialogs, WithDialogs } from "dialogs";
import { RepoDialog } from "./components/repo_dialog";
import { EmptyStatePanel } from "cockpit-components-empty-state";
import { RefreshAllButton } from "./components/repo_refresh";

const _ = cockpit.gettext;

export const RepoChangesContext = createContext<{
  reposChanged: number | null;
  setReposChanged: Dispatch<SetStateAction<number>> | null;
}>({
    reposChanged: null,
    setReposChanged: null,
});

export const Application = () => {
    const [reposChanged, setReposChanged] = useState<number>(0);

    return (
        <RepoChangesContext.Provider
      value={{
          reposChanged,
          setReposChanged,
      }}
        >
            <WithDialogs>
                <RepoCard />
            </WithDialogs>
        </RepoChangesContext.Provider>
    );
};

const RepoCard = () => {
    const [backend, _setBackend] = useState<Backend>(new Zypp());
    const [repos, setRepos] = useState<Repo[]>([]);
    const { reposChanged, setReposChanged } = useContext(RepoChangesContext);

    const Dialogs = useDialogs();

    useEffect(() => {
        backend.getRepos().then((repos) => {
            setRepos(repos);
        });
    }, [backend, reposChanged]);

    return (
        <Card>
            <CardHeader
        actions={{
            actions: (
                <>
                <RefreshAllButton backend={backend}/>
                <Button
              variant="secondary"
              id="settings-button"
              component="a"
              onClick={() =>
                  Dialogs.show(<RepoDialog title={_("Add a repo")} backend={backend} repo={null} />)}
                >
                    {_("Add Repo")}
                </Button>
                </>
            ),
        }}
            >
                <CardTitle>{_("Software Repositories")}</CardTitle>
            </CardHeader>
            <CardBody>
                {repos
                    ? (
                        <RepoList repos={repos} backend={backend} />
                    )
                    : (
                        <EmptyStatePanel loading />
                    )}
            </CardBody>
        </Card>
    );
};
