import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@patternfly/react-core";
import { useDialogs } from "dialogs";

import cockpit from "cockpit";

const _ = cockpit.gettext;

export const ConfirmationDialog = ({
    title,
    callback,
    content,
}: {
    title: string;
    callback: () => void;
    content?: React.ReactNode;
}) => {
    const Dialogs = useDialogs();

    return (
        <Modal
            variant="small"
            onClose={() => Dialogs.close()}
            isOpen
        >
            <ModalHeader title={title} />
            <ModalBody>
                {content}
            </ModalBody>
            <ModalFooter>
                <>
                    <Button
                        variant="danger"
                        onClick={() => { callback(); Dialogs.close() }}
                        aria-label={title}
                    >
                        {_("Delete")}
                    </Button>
                    <Button
                        variant="link"
                        className="btn-cancel"
                        onClick={() => Dialogs.close()}
                    >
                        {_("Cancel")}
                    </Button>
                </>
            </ModalFooter>
        </Modal>
    );
};
