import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, Button, DataTable } from '@/components/ui';
import { Users, Link, CopyCheck } from 'lucide-react';
import type { UserRole, Profile } from '@/types';
import type { Column } from '@/components/ui/DataTable';

export const SettingsStaff: React.FC = () => {
    const { staffProfiles, updateStaffRole, inviteUser } = useAppContext();
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);

    // Sort profiles: Admins on top
    const sortedProfiles = [...staffProfiles].sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.display_name.localeCompare(b.display_name);
    });

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUser(email);
            // Simulate link generation
            navigator.clipboard.writeText(`https://radpadi.ng/signup?invite=${btoa(email)}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            setEmail('');
        } catch (error) {
            console.error("Invite failed", error);
        }
    };

    const handleRoleChange = async (profileId: string, newRole: UserRole) => {
        if (!confirm(`Are you sure you want to change this user's access level to ${newRole.toUpperCase()}?`)) return;
        await updateStaffRole(profileId, newRole);
        alert('Role updated successfully.');
    };

    const columns: Column<Profile>[] = [
        { header: 'Full Name', accessorKey: 'display_name', sortable: true },
        { header: 'Email', accessorKey: 'email', sortable: true },
        {
            header: 'Access Role',
            accessorKey: (row: Profile) => (
                <select
                    value={row.role}
                    onChange={(e) => handleRoleChange(row.id, e.target.value as UserRole)}
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
        <Card className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-border pb-4 gap-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-500" />
                    Staff Access Control
                </h3>
            </div>

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
    );
};
