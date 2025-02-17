import {
    ActionGroup,
    Button,
    Checkbox,
    Form,
    FormGroup,
    TextInput,
} from "@patternfly/react-core";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Backend, Repo } from "../backends/backend";
import { EmptyStatePanel } from 'cockpit-components-empty-state';

import cockpit from "cockpit";
import { RepoChangesContext } from "../app";

const _ = cockpit.gettext;

const RepoForm = ({
    backend,
    repo,
    close,
}: {
  backend: Backend;
  repo: null | Repo;
  close: () => void;
}) => {
    const { reposChanged, setReposChanged } = useContext(RepoChangesContext);
    const [editing, setEditing] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<Repo>({
        index: 0,
        alias: "",
        name: "",
        priority: 99,
        enabled: true,
        autorefresh: true,
        gpgcheck: true,
        uri: "",
    });

    useEffect(() => {
        console.log(reposChanged);
    }, [reposChanged]);

    const onValueChange = useCallback(
        (fieldName: string, value: string | number | boolean) => {
            setFormData({ ...formData, [fieldName]: value });
        },
        [setFormData, formData],
    );

    const submit = useCallback(() => {
        if (!submitting) {
            // Add repo
            setSubmitting(true);
            let callback: Promise<any>;
            if (editing) {
                callback = backend.modifyRepo(formData);
            } else {
                callback = backend.addRepo(formData);
            }
            callback.then((response) => {
                console.log(response);
                console.log(reposChanged, setReposChanged);
                if (setReposChanged !== null && reposChanged !== null)
                    setReposChanged(reposChanged + 1);
                setSubmitting(false);
                close();
            });
        }
    }, [submitting, formData, reposChanged, setReposChanged]);

    useEffect(() => {
        if (repo) {
            setFormData(repo);
            setEditing(true);
        }
    }, [repo]);

    if (submitting)
        return <EmptyStatePanel loading />;

    return (
        <Form>
            <FormGroup label={_("Alias")} fieldId="alias">
                <TextInput
          aria-label="Alias"
          onChange={(_, value) => onValueChange("alias", value)}
          value={formData.alias}
          placeholder=""
          isDisabled={editing}
                />
                {editing && <p>{_("Repo alias cannot be edited via Cockpit")}</p>}
            </FormGroup>
            <FormGroup label={_("Name")} fieldId="name">
                <TextInput
          aria-label="Name"
          onChange={(_, value) => onValueChange("name", value)}
          value={formData.name}
          placeholder=""
                />
            </FormGroup>
            <FormGroup label={_("Priority")} fieldId="priority">
                <TextInput
          aria-label="Priority"
          onChange={(_, value) => onValueChange("priority", value)}
          value={formData.priority}
          placeholder="99"
                />
            </FormGroup>
            <FormGroup label={_("Enabled")} fieldId="enabled">
                <Checkbox
          id="enabled"
          aria-label="Enabled"
          onChange={(_, value) => onValueChange("enabled", value)}
          isChecked={formData.enabled}
                />
            </FormGroup>
            <FormGroup label={_("Autorefresh")} fieldId="autorefresh">
                <Checkbox
          id="autorefresh"
          aria-label="Autorefresh"
          onChange={(_, value) => onValueChange("autorefresh", value)}
          isChecked={formData.autorefresh}
                />
            </FormGroup>
            <FormGroup label={_("GPG Check")} fieldId="gpg_check">
                <Checkbox
          id="gpg_check"
          aria-label="GPG Check"
          onChange={(_, value) => onValueChange("gpgcheck", value)}
          isChecked={formData.gpgcheck}
                />
            </FormGroup>
            <FormGroup label={_("Uri")} fieldId="uri">
                <TextInput
          aria-label="Uri"
          onChange={(_, value) => onValueChange("uri", value)}
          value={formData.uri}
          placeholder=""
          isDisabled={editing}
                />
                {editing && <p>{_("Repo Uri cannot be edited via Cockpit")}</p>}
            </FormGroup>
            <ActionGroup>
                <Button onClick={submit} variant="primary">
                    {_("Save")}
                </Button>
            </ActionGroup>
        </Form>
    );
};

export default RepoForm;
