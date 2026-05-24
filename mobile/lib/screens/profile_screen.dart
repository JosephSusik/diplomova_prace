import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_manager.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthManager>();
    final user = auth.user;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        centerTitle: false,
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              children: [
                // Avatar
                Center(
                  child: CircleAvatar(
                    radius: 44,
                    backgroundColor: scheme.primaryContainer,
                    child: Text(
                      _initials(user.name, user.surname),
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: scheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: Text(
                    '${user.name} ${user.surname}',
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 4),
                Center(
                  child: _RoleBadge(role: user.role),
                ),
                const SizedBox(height: 32),

                // Info card
                Card(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                  color: scheme.surfaceContainerLow,
                  child: Column(
                    children: [
                      _InfoRow(
                        icon: Icons.email_outlined,
                        label: 'E-mail',
                        value: user.email,
                      ),
                      Divider(
                          height: 1,
                          indent: 56,
                          color: scheme.outlineVariant),
                      _InfoRow(
                        icon: Icons.badge_outlined,
                        label: 'Role',
                        value: user.role,
                      ),
                      Divider(
                          height: 1,
                          indent: 56,
                          color: scheme.outlineVariant),
                      _InfoRow(
                        icon: Icons.calendar_today_outlined,
                        label: 'Registrace',
                        value: _formatDate(user.createdAt),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Logout
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    side: BorderSide(color: scheme.error),
                    foregroundColor: scheme.error,
                  ),
                  icon: const Icon(Icons.logout),
                  label: const Text('Odhlásit se'),
                  onPressed: () => _confirmLogout(context, auth),
                ),
              ],
            ),
    );
  }

  String _initials(String name, String surname) {
    final first = name.isNotEmpty ? name[0].toUpperCase() : '';
    final last = surname.isNotEmpty ? surname[0].toUpperCase() : '';
    return '$first$last';
  }

  String _formatDate(String isoDate) {
    if (isoDate.isEmpty) return '–';
    try {
      final dt = DateTime.parse(isoDate);
      return '${dt.day}. ${dt.month}. ${dt.year}';
    } catch (_) {
      return isoDate;
    }
  }

  Future<void> _confirmLogout(
      BuildContext context, AuthManager auth) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Odhlásit se?'),
        content:
            const Text('Budete přesměrováni na přihlašovací obrazovku.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Zrušit'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(
                foregroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Odhlásit'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await auth.logout();
      // _RootRouter in main.dart will rebuild and show LoginScreen.
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: scheme.primary, size: 22),
          const SizedBox(width: 18),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: scheme.onSurfaceVariant)),
              Text(value,
                  style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: role == 'Admin'
            ? scheme.tertiaryContainer
            : scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        role,
        style: TextStyle(
          color: role == 'Admin'
              ? scheme.onTertiaryContainer
              : scheme.onSecondaryContainer,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }
}
