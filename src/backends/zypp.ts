import cockpit, { Spawn } from "cockpit";

import { Backend, Repo } from "./backend";

export class Zypp implements Backend {
    deleteRepo(repo: Repo): Promise<any> {
        return cockpit.spawn(["zypper", "removerepo", repo.index.toString()], { superuser: "require" });
    }

    async getRepos(): Promise<Repo[]> {
        return cockpit.spawn(["zypper", "--xmlout", "repos"]).then((response) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, "text/xml");
            let index = 1;
            const repos = Array.from(doc.documentElement.querySelectorAll("repo")).map(
                (repo): Repo => {
                    const definedRepo = {
                        index,
                        alias: repo.getAttribute("alias") || "",
                        name: repo.getAttribute("name") || "",
                        priority: parseInt(repo.getAttribute("priority") || ""),
                        enabled: repo.getAttribute("enabled") === "1",
                        autorefresh: repo.getAttribute("autorefresh") === "1",
                        gpgcheck: repo.getAttribute("gpgcheck") === "1",
                        uri: repo.querySelector("url")?.textContent || "",
                    };

                    index++;
                    return definedRepo;
                },
            );
            return repos;
        });
    }

    addRepo(repo: Repo): Promise<any> {
        const args = ["-n", repo.name, "-p", repo.priority.toString()];
        if (repo.enabled) {
            args.push("--enable");
        } else {
            args.push("--disable");
        }
        if (repo.autorefresh) {
            args.push("--refresh");
        } else {
            args.push("--no-refresh");
        }
        if (repo.gpgcheck) {
            args.push("--gpgcheck");
        } else {
            args.push("--no-gpgcheck");
        }
        if (repo.uri.endsWith(".repo")) {
            args.push(...["-r", repo.uri]);
        }
        return cockpit.spawn(["zypper", "addrepo", ...args, repo.uri, repo.alias], { superuser: "require" });
    }

    modifyRepo(repo: Repo): Promise<any> {
        const args = ["-n", repo.name, "-p", repo.priority.toString()];
        if (repo.enabled) {
            args.push("--enable");
        } else {
            args.push("--disable");
        }
        if (repo.autorefresh) {
            args.push("--refresh");
        } else {
            args.push("--no-refresh");
        }
        if (repo.gpgcheck) {
            args.push("--gpgcheck");
        } else {
            args.push("--no-gpgcheck");
        }
        return cockpit.spawn(["zypper", "modifyrepo", ...args, repo.index.toString()], { superuser: "require" });
    }

    refreshRepo(repo: Repo | null, importKeys?: boolean): Spawn<string> {
        let refArgs: string[] = [];
        let zypArgs: string[] = []
        // if there's no repos defined, all will be refreshed
        if (repo) {
            refArgs = ["-r", repo.index.toString()];
        }
        if (importKeys) {
            zypArgs = ["--gpg-auto-import-keys"];
        }

        return cockpit.spawn(["zypper", ...zypArgs, "refresh", ...refArgs], { superuser: "require" });
    }
}
