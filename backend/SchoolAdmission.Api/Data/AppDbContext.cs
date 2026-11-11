using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<AcademicClass> AcademicClasses => Set<AcademicClass>();
    public DbSet<AcademicShift> AcademicShifts => Set<AcademicShift>();
    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<SeatHold> Holds => Set<SeatHold>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Student Table
        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("students");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).HasMaxLength(64);
            entity.Property(s => s.BirthCertificateNo).IsRequired().HasMaxLength(17);
            entity.Property(s => s.FullName).IsRequired().HasMaxLength(200);
            entity.Property(s => s.DateOfBirth).IsRequired();
            entity.Property(s => s.Gender).IsRequired().HasMaxLength(16);
            entity.Property(s => s.FatherName).IsRequired().HasMaxLength(200);
            entity.Property(s => s.MotherName).IsRequired().HasMaxLength(200);
            entity.Property(s => s.GuardianPhone).HasMaxLength(20);
            entity.Property(s => s.PresentAddress).HasMaxLength(500);
            entity.Property(s => s.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );
            entity.HasIndex(s => s.BirthCertificateNo).IsUnique();
        });

        // Academic Class Table
        modelBuilder.Entity<AcademicClass>(entity =>
        {
            entity.ToTable("academic_classes");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasMaxLength(64);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );
        });

        // Academic Shift Table
        modelBuilder.Entity<AcademicShift>(entity =>
        {
            entity.ToTable("academic_shifts");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).HasMaxLength(64);
            entity.Property(s => s.Name).IsRequired().HasMaxLength(100);
            entity.Property(s => s.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );
        });

        // Class / Admission Session Table
        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.ToTable("classes");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasMaxLength(64);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.TotalSeats).IsRequired();
            entity.Property(c => c.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );

            entity.HasOne(c => c.ClassLevel)
                  .WithMany(cl => cl.Sessions)
                  .HasForeignKey(c => c.ClassLevelId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(c => c.Shift)
                  .WithMany(sh => sh.Sessions)
                  .HasForeignKey(c => c.ShiftId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Seat Holds Table
        modelBuilder.Entity<SeatHold>(entity =>
        {
            entity.ToTable("holds");
            entity.HasKey(h => h.Id);
            entity.Property(h => h.Id).HasMaxLength(64);
            entity.Property(h => h.ClassId).IsRequired().HasMaxLength(64);
            entity.Property(h => h.StudentId).IsRequired().HasMaxLength(32);
            entity.Property(h => h.StudentProfileId).HasMaxLength(64);
            entity.Property(h => h.Status).IsRequired().HasMaxLength(32);

            entity.Property(h => h.ExpiresAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );
            entity.Property(h => h.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );

            entity.HasOne(h => h.Class)
                  .WithMany(c => c.Holds)
                  .HasForeignKey(h => h.ClassId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(h => h.StudentProfile)
                  .WithMany(s => s.Holds)
                  .HasForeignKey(h => h.StudentProfileId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(h => h.ClassId);
            entity.HasIndex(h => h.StudentId);
            entity.HasIndex(h => new { h.ClassId, h.Status });
            entity.HasIndex(h => new { h.StudentId, h.ClassId, h.Status });
        });

        // Admin User Table
        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("admin_users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasMaxLength(64);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(64);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(256);
            entity.Property(u => u.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );
            entity.HasIndex(u => u.Username).IsUnique();
        });
    }
}
