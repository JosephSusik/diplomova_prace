class User {
  final String id;
  final String email;
  final String name;
  final String surname;
  final String role;
  final String createdAt;

  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.surname,
    required this.role,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String,
        surname: json['surname'] as String,
        role: json['role'] as String? ?? 'User',
        createdAt: json['createdAt'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'surname': surname,
        'role': role,
        'createdAt': createdAt,
      };
}

class LoginResponse {
  final String token;
  final User user;
  final String message;

  const LoginResponse({
    required this.token,
    required this.user,
    required this.message,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
        token: json['token'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
        message: json['message'] as String? ?? '',
      );
}
