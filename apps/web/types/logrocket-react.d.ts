declare module "logrocket-react" {
  import LogRocket from "logrocket";

  export default function setupLogRocketReact(
    LogRocket: typeof LogRocket,
  ): void;
}
