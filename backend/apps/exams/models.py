"""
Models for Exam preparation, syllabus tracking, mock tests, and mistake notebook.
"""
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


EXAM_TYPE_CHOICES = [
    ("UPSC", "UPSC"),
    ("NDA", "NDA"),
    ("CDS", "CDS"),
    ("AFCAT", "AFCAT"),
    ("SSC", "SSC"),
    ("Banking", "Banking"),
    ("State", "State"),
    ("Custom", "Custom"),
]

TOPIC_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("in_progress", "In Progress"),
    ("completed", "Completed"),
    ("needs_revision", "Needs Revision"),
]


class ExamProfile(BaseModel):
    """
    Profile for a target competitive or academic examination.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exam_profiles",
    )
    exam_type = models.CharField(max_length=50, choices=EXAM_TYPE_CHOICES)
    exam_name = models.CharField(max_length=200)
    target_date = models.DateField(null=True, blank=True)
    attempt_number = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-is_active", "target_date"]
        verbose_name = "Exam Profile"
        verbose_name_plural = "Exam Profiles"

    def __str__(self):
        return f"{self.exam_name} ({self.exam_type})"


class Subject(BaseModel):
    """
    Subject under an exam syllabus (e.g., Polity, History, Quant).
    """

    exam_profile = models.ForeignKey(
        ExamProfile,
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    name = models.CharField(max_length=200)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    color = models.CharField(max_length=7, default="#6366f1")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"

    def __str__(self):
        return f"{self.exam_profile.exam_name} -> {self.name}"


class Chapter(BaseModel):
    """
    Chapter or module within a subject.
    """

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="chapters",
    )
    name = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_completed = models.BooleanField(default=False)
    status = models.CharField(
        max_length=30,
        choices=TOPIC_STATUS_CHOICES,
        default="pending",
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Chapter"
        verbose_name_plural = "Chapters"

    def __str__(self):
        return f"{self.subject.name} -> {self.name}"


class Topic(BaseModel):
    """
    Granular topic within a chapter.
    """

    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]

    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name="topics",
    )
    name = models.CharField(max_length=300)
    status = models.CharField(
        max_length=30,
        choices=TOPIC_STATUS_CHOICES,
        default="pending",
    )
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="medium",
    )
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["chapter", "name"]
        verbose_name = "Topic"
        verbose_name_plural = "Topics"

    def __str__(self):
        return self.name


class MockTest(BaseModel):
    """
    Performance record from a mock test examination.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mock_tests",
    )
    exam_profile = models.ForeignKey(
        ExamProfile,
        on_delete=models.CASCADE,
        related_name="mock_tests",
    )
    test_name = models.CharField(max_length=200)
    test_date = models.DateField()
    total_marks = models.IntegerField()
    obtained_marks = models.DecimalField(max_digits=7, decimal_places=2)
    total_questions = models.IntegerField()
    attempted = models.IntegerField(default=0)
    correct = models.IntegerField(default=0)
    incorrect = models.IntegerField(default=0)
    unattempted = models.IntegerField(default=0)
    time_taken_mins = models.IntegerField(null=True, blank=True)
    percentile = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-test_date", "-created_at"]
        verbose_name = "Mock Test"
        verbose_name_plural = "Mock Tests"

    def __str__(self):
        return f"{self.test_name} ({self.obtained_marks}/{self.total_marks})"


class MockTestSubjectScore(BaseModel):
    """
    Subject-wise breakdown of marks for a mock test.
    """

    mock_test = models.ForeignKey(
        MockTest,
        on_delete=models.CASCADE,
        related_name="subject_scores",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="mock_test_scores",
    )
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    max_marks = models.DecimalField(max_digits=6, decimal_places=2)
    correct = models.IntegerField(default=0)
    incorrect = models.IntegerField(default=0)
    attempted = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Mock Test Subject Score"
        verbose_name_plural = "Mock Test Subject Scores"

    def __str__(self):
        return f"{self.mock_test.test_name} - {self.subject.name}: {self.marks_obtained}/{self.max_marks}"


class MistakeNotebook(BaseModel):
    """
    Repository of mistakes, conceptual errors, and unattempted questions for revision.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mistake_entries",
    )
    mock_test = models.ForeignKey(
        MockTest,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mistakes",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="mistakes",
    )
    topic = models.ForeignKey(
        Topic,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mistakes",
    )
    question_text = models.TextField()
    correct_answer = models.TextField()
    user_answer = models.TextField(blank=True)
    explanation = models.TextField(blank=True)
    reviewed = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["reviewed", "-created_at"]
        verbose_name = "Mistake Notebook Entry"
        verbose_name_plural = "Mistake Notebook Entries"

    def __str__(self):
        return f"Mistake: {self.subject.name} - {self.question_text[:50]}"
