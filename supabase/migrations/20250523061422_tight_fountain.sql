/*
  # Initial Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text, nullable)
      - `role` (text, enum: admin/teacher/student)
      - `password` (text, nullable)
      - `created_at` (timestamptz)
    
    - `exams`
      - `id` (uuid, primary key)
      - `title` (text)
      - `access_code` (text, unique)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references users)
      - `is_taken` (boolean)
      - `time_limit` (integer, nullable)
      - `questions` (jsonb)

    - `submissions`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `student_id` (uuid, references users)
      - `answers` (jsonb)
      - `flagged` (boolean)
      - `flag_reasons` (jsonb)
      - `submitted_at` (timestamptz)
      - `started_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Add constraints for data integrity
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  password text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  access_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES users(id),
  is_taken boolean DEFAULT false,
  time_limit integer,
  questions jsonb NOT NULL
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) NOT NULL,
  student_id uuid REFERENCES users(id) NOT NULL,
  answers jsonb NOT NULL,
  flagged boolean DEFAULT false,
  flag_reasons jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Allow admins to manage all users"
  ON users
  TO public
  USING (is_admin());

CREATE POLICY "Allow users to read their own data"
  ON users
  TO public
  FOR SELECT
  USING (auth.uid() = id);

-- RLS Policies for exams table
CREATE POLICY "Allow admins to manage all exams"
  ON exams
  TO public
  USING (uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Allow teachers to manage their own exams"
  ON exams
  TO public
  USING (uid() = created_by);

CREATE POLICY "Allow students to view available exams"
  ON exams
  TO public
  FOR SELECT
  USING (true);

-- RLS Policies for submissions table
CREATE POLICY "Allow admins to see all submissions"
  ON submissions
  TO public
  USING (uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Allow students to submit and see their own submissions"
  ON submissions
  TO public
  USING (uid() = student_id);

CREATE POLICY "Allow teachers to see submissions for their exams"
  ON submissions
  TO public
  FOR SELECT
  USING (uid() IN (
    SELECT created_by 
    FROM exams 
    WHERE exams.id = submissions.exam_id
  ));

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;