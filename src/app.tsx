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
import { Alert, Button, Page, PageSection } from "@patternfly/react-core";
import { useDialogs, WithDialogs } from "dialogs";
import { RepoDialog } from "./components/repo_dialog";
import { EmptyStatePanel } from "cockpit-components-empty-state";
import { RefreshAllButton } from "./components/repo_refresh";

import { superuser } from 'superuser';
import { LockIcon } from "@patternfly/react-icons";

const _ = cockpit.gettext;

export const RepoChangesContext = createContext<{
  reposChanged: number | null;
  setReposChanged: Dispatch<SetStateAction<number>> | null;
}>({
    reposChanged: null,
    setReposChanged: null,
});

export const SuperuserContext = createContext<boolean | null>(null);

export const Application = () => {
    const [reposChanged, setReposChanged] = useState<number>(0);
    const [superuserValue, setSuperuserValue] = useState<boolean | null>(superuser.allowed);

    useEffect(() => {
        const updateSuperuserValue = () => setSuperuserValue(superuser.allowed);
        superuser.addEventListener("changed", updateSuperuserValue);

        return () => superuser.removeEventListener("changed", updateSuperuserValue);
    }, [setSuperuserValue]);

    return (
        <SuperuserContext.Provider value={superuserValue}>
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
        </SuperuserContext.Provider>
    );
};

const RepoCard = () => {
    const [backend,] = useState<Backend>(new Zypp());
    const [repos, setRepos] = useState<Repo[]>([]);
    const { reposChanged, setReposChanged } = useContext(RepoChangesContext);
    const [reposHash, setReposHash] = useState<string>("");

    const Dialogs = useDialogs();
    const superuserAllowed = useContext(SuperuserContext);

    useEffect(() => {
        backend.getRepos().then((repos) => {
            setRepos(repos);
        });
    }, [backend, reposChanged]);

    useEffect(() => {
        const reposUpdate = setInterval(() => {
            backend.getReposHash()
                    .then((response) => {
                        const newHash = response.split(" ")[0];

                        if (newHash !== reposHash) {
                            setReposHash(newHash);
                            setReposChanged(reposChanged + 1);
                        }
                    });
        }, 1000);

        return () => clearInterval(reposUpdate);
    }, [reposHash, setReposHash, reposChanged, setReposChanged, backend]);

    return (
        <Page>
            {!superuserAllowed
                ? (
                    <Alert
className="ct-limited-access-alert"
                  variant="warning" isInline
                  customIcon={<LockIcon />}
                  title={_("Web console is running in limited access mode. To add or edit a repository please turn on administrative access")}
                    />
                )
                : ""}
            <PageSection>
                <Card>
                    <CardHeader
        actions={{
            actions: superuserAllowed === true
                ? (
                    <>
                        <RefreshAllButton backend={backend} />
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
                )
                : "",
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
            </PageSection>
        </Page>
    );
};
