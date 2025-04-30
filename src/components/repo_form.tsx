import {
    ActionGroup,
    Button,
    Checkbox,
    CodeBlock,
    CodeBlockCode,
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
    const [error, setError] = useState<string | null>(null);
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
            let callback: Promise<string>;
            if (editing) {
                callback = backend.modifyRepo(formData);
            } else {
                callback = backend.addRepo(formData);
            }
            callback.then(() => {
                if (setReposChanged !== null && reposChanged !== null)
                    setReposChanged(reposChanged + 1);
                setSubmitting(false);
                close();
            }).catch((response) => {
                setSubmitting(false);
                setError(response.message);
            });
        }
    }, [submitting, formData, reposChanged, setReposChanged, backend, close, editing]);

    useEffect(() => {
        if (repo) {
            setFormData(repo);
            setEditing(true);
        }
    }, [repo]);

    if (submitting)
        return <EmptyStatePanel loading />;

    if (error)
        return (
            <>
                <p>{_("There was an error adding the repo:")}</p>
                <CodeBlock className='pf-v6-u-mx-auto error-log'>
                    <CodeBlockCode>
                        {error}
                    </CodeBlockCode>
                </CodeBlock>
            </>
        );

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
