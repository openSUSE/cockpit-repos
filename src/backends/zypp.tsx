import cockpit, { Spawn } from "cockpit";
import React from "react";

import { Backend, MessageSpawn, RefreshError, Repo } from "./backend";

const _ = cockpit.gettext;

export class Zypp implements Backend {
    deleteRepo(repo: Repo): MessageSpawn {
        return cockpit.spawn(["zypper", "--xmlout", "removerepo", repo.index.toString()], { superuser: "require", err: "message" }) as MessageSpawn;
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

    addRepo(repo: Repo): Promise<string> {
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

    modifyRepo(repo: Repo): Promise<string> {
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

    refreshRepo(repo: Repo | null, importKeys?: boolean): MessageSpawn {
        let refArgs: string[] = [];
        let zypArgs: string[] = [];
        // if there's no repos defined, all will be refreshed
        if (repo) {
            refArgs = ["-r", repo.index.toString()];
        }
        if (importKeys) {
            zypArgs = ["--gpg-auto-import-keys"];
        }

        return cockpit.spawn(["zypper", "--xmlout", ...zypArgs, "refresh", "-f", ...refArgs], { superuser: "require", err: "message" }) as MessageSpawn;
    }

    getReposHash(): Spawn<string> {
        return cockpit.spawn(["bash", "-c", "zypper repos -d | md5sum"]);
    }

    parseError(error: string): RefreshError {
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
            return { err: "locked", message: doc.documentElement.querySelector("message[type*='info']")!.textContent || "" };
        }

        return { err: "unknown" };
    }

    getErrorMsg(error: RefreshError): React.ReactNode {
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
    }
}
