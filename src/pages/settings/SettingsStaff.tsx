import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Button, DataTable } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { Users, Link, CopyCheck } from 'lucide-react';
import type { UserRole, Profile } from '@/types';
import type { Column } from '@/components/ui/DataTable';

export const SettingsStaff: React.FC = () => {
    const { staffProfiles, updateStaffRole, inviteUser } = useAppContext();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);

    // Confirm role-change state
    const [pendingRole, setPendingRole] = useState<{ profileId: string; newRole: UserRole; label: string } | null>(null);

    const sortedProfiles = [...staffProfiles].sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.display_name.localeCompare(b.display_name);
    });

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUser(email);
            navigator.clipboard.writeText(`https://radpadi.ng/signup?invite=${btoa(email)}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            setEmail('');
            showToast('Invite link copied to clipboard.', 'success');
        } catch (error) {
            showToast('Failed to generate invite link.', 'error');
        }
    };

    const handleConfirmRoleChange = async () => {
        if (!pendingRole) return;
        try {
            await updateStaffRole(pendingRole.profileId, pendingRole.newRole);
            showToast(`Role updated to ${pendingRole.newRole.toUpperCase()}.`, 'success');
        } catch {
            showToast('Failed to update role.', 'error');
        }
        setPendingRole(null);
    };

    const columns: Column<Profile>[] = [
        { header: 'Full Name', accessorKey: 'display_name', sortable: true },
        { header: 'Email', accessorKey: 'email', sortable: true },
        {
            header: 'Access Role',
            accessorKey: (row: Profile) => (
                <select
                    value={row.role}
                    onChange={(e) => setPendingRole({
                        profileId: row.id,
                        newRole: e.target.value as UserRole,
                        label: e.target.value,
                    })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none ${row.role === 'admin'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                >
                    <option value="admin">SYSTEM ADMIN</option>
                    <option value="radiology_user">RADIOGRAPHER</option>
                </select>
            )
        },
        {
            header: 'Enrolled Date',
            accessorKey: (row: Profile) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A',
            align: 'right' as const
        }
    ];

    return (
        <>
            <Card className="p-8">
                <SectionHeader title="Staff Access Control" icon={Users} iconClassName="text-purple-500" />

                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-center gap-3 mb-8 bg-slate-50 p-2 pl-4 rounded-[2rem] border border-slate-200 shadow-sm max-w-xl">
                    <div className="flex-1 flex items-center justify-end w-full">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="radiographer@radpadi.ng"
                            required
                            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
                        />
                    </div>
                    <Button type="submit" icon={copied ? CopyCheck : Link} className="rounded-full shrink-0 px-6">
                        {copied ? 'Link Copied!' : 'Generate Invite Link'}
                    </Button>
                </form>

                <div className="overflow-hidden rounded-xl border border-border">
                    <DataTable columns={columns} data={sortedProfiles} />
                </div>
            </Card>

            <ConfirmModal
                isOpen={!!pendingRole}
                onClose={() => setPendingRole(null)}
                onConfirm={handleConfirmRoleChange}
                title="Change access role?"
                message={`Are you sure you want to update this user's access level to ${pendingRole?.newRole?.toUpperCase()}?`}
                confirmLabel="Update Role"
                destructive={false}
            />
        </>
    );
};
