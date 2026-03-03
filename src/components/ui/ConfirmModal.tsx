import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    destructive?: boolean;
}

/**
 * Drop-in replacement for the native `confirm()` dialog.
 * Uses the existing accessible Modal component.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    destructive = true,
}) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
            <span className="flex items-center gap-2">
                {destructive && <AlertTriangle className="w-5 h-5 text-danger" />}
                {title}
            </span>
        }
        maxWidth="sm"
        footer={
            <>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                    variant={destructive ? 'danger' : 'primary'}
                    onClick={() => { onConfirm(); onClose(); }}
                >
                    {confirmLabel}
                </Button>
            </>
        }
    >
        <p className="text-text-secondary">{message}</p>
    </Modal>
);
