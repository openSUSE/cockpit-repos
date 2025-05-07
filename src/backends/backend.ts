// enum RepoType {
//   ftp,
//   http,
//   https,
//   smb_cifs,
//   nfs,
//   cd,
//   dvd,
//   hard_disk,
//   usb,
//   local_directory,
//   local_iso_image,
// }

import { Spawn } from "cockpit";

type Repo = {
  index: number,
  alias: string,
  name: string,
  // type: RepoType,
  priority: number,
  enabled: boolean,
  autorefresh: boolean,
  gpgcheck: boolean,
  uri: string,
}

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

export type RefreshError = UknownRefresh | LockedRefresh | UntrustedRefresh | InvalidRefresh;

// Return type for cockpit.spawn where options include {err: "message"}
// Cockpit uses Spawn typescript type even though it doesn't always adhere to
// the API definitions so we need to build our own (slightly hacky) type
export interface MessageSpawn extends Omit<Spawn<string>, "then" | "catch"> {
    then: (funfilled?: (value: string) => void) => MessageSpawn;
    catch: (onreject?: (error: string, reason: string) => void) => MessageSpawn;
}

interface Backend {
  getRepos(): Promise<Repo[]>,
  addRepo(repo: Repo): Promise<string>
  deleteRepo(repo: Repo): MessageSpawn
  modifyRepo(repo: Repo): Promise<string>
  refreshRepo(repo: Repo | null, importKeys?: boolean): MessageSpawn
  getReposHash(): Spawn<string>
  parseError(error: string): RefreshError
  getErrorMsg(error: RefreshError): React.ReactNode
}

export { Repo, Backend };
